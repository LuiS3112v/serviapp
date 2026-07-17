"use client";

import { MessageCircle, Loader2, ShieldCheck, MapPin } from 'lucide-react';
import { ProviderLocation, ProviderWithDistance } from '@/lib/geolocation.api';
import styles from './ProviderInfoCard.module.css';

interface ProviderInfoCardProps {
  provider: ProviderLocation | ProviderWithDistance;
  onClose: () => void;
  onConverse: (providerId: string) => void;
  isConversing: boolean;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function ProviderInfoCard({
  provider, onClose, onConverse, isConversing,
}: ProviderInfoCardProps) {
  const withDistance = provider as ProviderWithDistance;
  const hasDistance = withDistance.distanceKm != null;

  return (
    <div className={styles['provider-info-card']}>
      <button className={styles['provider-info-card__close']} onClick={onClose} aria-label="Fechar">
        &times;
      </button>

      <div className={styles['provider-info-card__header']}>
        <div className={styles['provider-info-card__avatar']}>
          {provider.avatarUrl
            ? <img src={provider.avatarUrl} alt={provider.fullName} />
            : getInitials(provider.fullName)}
          <span
            className={`${styles['provider-info-card__status-dot']} ${
              provider.isOnline
                ? styles['provider-info-card__status-dot--online']
                : styles['provider-info-card__status-dot--offline']
            }`}
          />
        </div>
        <div className={styles['provider-info-card__identity']}>
          <div className={styles['provider-info-card__name-row']}>
            <span className={styles['provider-info-card__name']}>{provider.fullName}</span>
            {provider.isVerified && (
              <ShieldCheck size={14} className={styles['provider-info-card__verified-icon']} />
            )}
          </div>
          {provider.category && (
            <span className={styles['provider-info-card__category']}>{provider.category}</span>
          )}
        </div>
      </div>

      {provider.bio && <p className={styles['provider-info-card__bio']}>{provider.bio}</p>}

      <div className={styles['provider-info-card__meta']}>
        {provider.district && (
          <div className={styles['provider-info-card__meta-item']}>
            <MapPin size={13} />
            <span>{provider.district}</span>
          </div>
        )}
        {hasDistance && (
          <div className={`${styles['provider-info-card__meta-item']} ${styles['provider-info-card__meta-item--highlight']}`}>
            <span>{formatDistance(withDistance.distanceKm)}</span>
            {withDistance.etaMinutes > 0 && <span> &middot; ~{withDistance.etaMinutes} min</span>}
          </div>
        )}
      </div>

      <button
        className={styles['provider-info-card__converse-button']}
        disabled={isConversing}
        onClick={() => onConverse(provider.id)}
      >
        {isConversing
          ? <><Loader2 size={16} className={styles['spin-icon']} /> A abrir conversa...</>
          : <><MessageCircle size={16} /> Conversar</>}
      </button>
    </div>
  );
}