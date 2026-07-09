import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { TransactionType } from '../../common/enums/transaction-type.enum';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  // ══════════════════════════════════════════════════════════════════════
  // getOrCreate — ÚNICO ponto de criação de wallet em toda a aplicação.
  // ServicesService delega para aqui em vez de duplicar esta lógica.
  //
  // FIX: findOne+save sem protecção é uma race condition clássica — se
  // dois pedidos chegam ao mesmo tempo para o mesmo userId (ex: o
  // frontend faz Promise.all([getWallet(), getTransactions()])), ambos
  // não encontram wallet, ambos tentam inserir, e o segundo insert
  // viola a unique constraint em "userId" (código Postgres 23505).
  //
  // Solução: apanhar esse erro específico e voltar a procurar — a
  // wallet que o pedido concorrente criou já lá está, devolvemo-la em
  // vez de rebentar com 500.
  // ══════════════════════════════════════════════════════════════════════
  async getOrCreate(userId: string): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({ where: { userId } });
    if (existing) return existing;

    try {
      return await this.walletRepo.save(
        this.walletRepo.create({ userId, balance: 0, heldBalance: 0 }),
      );
    } catch (err: any) {
      // 23505 = unique_violation — outro pedido ganhou a corrida e já
      // criou a wallet entre o nosso findOne e o nosso save.
      if (err?.code === '23505') {
        const wallet = await this.walletRepo.findOne({ where: { userId } });
        if (wallet) return wallet;
      }
      throw err;
    }
  }

  async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const wallet = await this.getOrCreate(userId);
    const [transactions, total] = await this.txRepo.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { transactions, total };
  }

  // Depósito mock (sem gateway real por agora)
  async deposit(userId: string, amount: number, description = 'Depósito'): Promise<Wallet> {
    if (amount <= 0) throw new BadRequestException('O montante tem de ser positivo.');
    if (amount > 10_000_000) throw new BadRequestException('Montante demasiado elevado.');

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const wallet = await this.getOrCreate(userId);
      const balBefore = Number(wallet.balance);
      wallet.balance = balBefore + amount;
      await qr.manager.save(wallet);

      await qr.manager.save(
        qr.manager.create(Transaction, {
          walletId: wallet.id,
          userId,
          type: TransactionType.DEPOSIT,
          amount,
          balanceBefore: balBefore,
          balanceAfter: wallet.balance,
          description,
          referenceType: 'deposit',
        }),
      );

      await qr.commitTransaction();
      return wallet;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // Levantamento mock
  async withdraw(userId: string, amount: number): Promise<Wallet> {
    if (amount <= 0) throw new BadRequestException('O montante tem de ser positivo.');

    const wallet = await this.getOrCreate(userId);
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Saldo insuficiente.');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const balBefore = Number(wallet.balance);
      wallet.balance = balBefore - amount;
      await qr.manager.save(wallet);

      await qr.manager.save(
        qr.manager.create(Transaction, {
          walletId: wallet.id,
          userId,
          type: TransactionType.WITHDRAWAL,
          amount: -amount,
          balanceBefore: balBefore,
          balanceAfter: wallet.balance,
          description: 'Levantamento',
          referenceType: 'withdrawal',
        }),
      );

      await qr.commitTransaction();
      return wallet;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}