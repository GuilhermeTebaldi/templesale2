import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  ShoppingCart,
  X,
} from 'lucide-react';
import type { NotificationDto } from '../lib/api';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationDto[];
  readNotificationIds: ReadonlySet<string>;
  fallbackImageUrl?: string;
  onSelectNotification: (notification: NotificationDto) => void;
  onMarkAllAsRead: () => void;
}

const isAdministrativeNotification = (notification: NotificationDto) =>
  notification.type === 'admin_broadcast' || notification.type === 'system_welcome';

const hasNotificationDestination = (notification: NotificationDto) => {
  switch (notification.type) {
    case 'publication_like':
    case 'publication_comment':
      return Number.isInteger(notification.publicationId) && notification.publicationId > 0;
    case 'product_like':
    case 'product_cart_interest':
    case 'product_comment':
      return Number.isInteger(notification.productId) && notification.productId > 0;
    case 'admin_broadcast':
      return (
        (Number.isInteger(notification.publicationId) && notification.publicationId > 0) ||
        (Number.isInteger(notification.productId) && notification.productId > 0)
      );
    default:
      return false;
  }
};
const getNotificationAuthor = (notification: NotificationDto) => {
  const actorName =
    'actorName' in notification ? String(notification.actorName ?? '').trim() : '';
  return actorName || (isAdministrativeNotification(notification) ? 'TempleSale' : 'Alguém');
};

const getNotificationImageUrl = (
  notification: NotificationDto,
  fallbackImageUrl?: string,
) => {
  const imageUrl =
    'productImageUrl' in notification
      ? String(notification.productImageUrl ?? '').trim()
      : '';
  return imageUrl || fallbackImageUrl || '';
};

const getNotificationIcon = (notification: NotificationDto) => {
  if (notification.type === 'product_like' || notification.type === 'publication_like') {
    return <Heart className="w-3 h-3" />;
  }
  if (notification.type === 'product_cart_interest') {
    return <ShoppingCart className="w-3 h-3" />;
  }
  if (
    notification.type === 'product_comment' ||
    notification.type === 'publication_comment'
  ) {
    return <MessageCircle className="w-3 h-3" />;
  }
  return <Bell className="w-3 h-3" />;
};

const getNotificationActionLabel = (notification: NotificationDto) => {
  if (notification.type === 'admin_broadcast') {
    if (Number.isInteger(notification.publicationId) && notification.publicationId > 0) {
      return 'Abrir publicação';
    }
    if (Number.isInteger(notification.productId) && notification.productId > 0) {
      return 'Abrir anúncio';
    }
    return 'Mensagem';
  }
  if (notification.type === 'product_like' || notification.type === 'product_cart_interest') {
    return 'Abrir anúncio';
  }
  if (notification.type === 'product_comment') {
    return 'Abrir anúncio';
  }
  if (notification.type === 'publication_like' || notification.type === 'publication_comment') {
    return 'Abrir publicação';
  }
  return 'Mensagem';
};
const formatRelativeTime = (createdAt: number) => {
  const numericDate = Number(createdAt);
  if (!Number.isFinite(numericDate)) {
    return '';
  }

  const timestamp = numericDate < 1_000_000_000_000
    ? numericDate * 1000
    : numericDate;
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSec < 60) return 'Agora';
  if (diffSec < 3600) return `Há ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `Há ${Math.floor(diffSec / 3600)} h`;

  const days = Math.floor(diffSec / 86400);
  return days === 1 ? 'Há 1 dia' : `Há ${days} dias`;
};

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
  readNotificationIds,
  fallbackImageUrl,
  onSelectNotification,
  onMarkAllAsRead,
}) => {
  const [expandedNotificationIds, setExpandedNotificationIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setExpandedNotificationIds([]);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.has(notification.id),
  ).length;

  return (
    <div
      id="notifications-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-14 bg-black/60 backdrop-blur-xs overflow-hidden sm:items-start sm:justify-end sm:p-4 sm:pt-16 sm:pr-6"
      onClick={onClose}
    >
      <div
        id="notifications-popover-card"
        className="flex w-full max-w-sm max-h-[82vh] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 sm:max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800/90 bg-neutral-900 p-3.5 sm:p-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-bold text-neutral-100">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-bold text-neutral-950">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="flex cursor-pointer items-center space-x-1 rounded-lg px-2 py-1 text-[11px] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Marcar lidas</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              title="Fechar notificações"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-neutral-800/80 bg-neutral-950/80 px-4 py-2 text-[11px] text-neutral-400">
          Atividades e mensagens recentes
        </div>

        <div className="flex-1 divide-y divide-neutral-800/60 overflow-y-auto overscroll-contain p-1">
          {notifications.length === 0 ? (
            <div className="space-y-1.5 px-6 py-12 text-center text-xs text-neutral-400">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800/60 text-neutral-400">
                <Bell className="h-5 w-5" />
              </div>
              <p className="font-medium text-neutral-300">
                Nenhuma notificação por enquanto
              </p>
              <p className="text-[11px] text-neutral-500">
                Quando houver uma nova atividade, o sino avisará você aqui.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isAdministrative = isAdministrativeNotification(notification);
              const canExpandMessage =
                isAdministrative &&
                (notification.message.includes('\n') || notification.message.length > 100);
              const isExpanded = expandedNotificationIds.includes(notification.id);
              const canOpen = hasNotificationDestination(notification);
              const isRead = readNotificationIds.has(notification.id);
              const imageUrl = getNotificationImageUrl(notification, fallbackImageUrl);

              return (
                <div
                  key={notification.id}
                  role={canOpen ? 'button' : undefined}
                  tabIndex={canOpen ? 0 : undefined}
                  onClick={
                    canOpen
                      ? () => onSelectNotification(notification)
                      : undefined
                  }
                  onKeyDown={
                    canOpen
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelectNotification(notification);
                          }
                        }
                      : undefined
                  }
                  className={[
                    'rounded-xl p-3 transition-colors',
                    isRead ? 'opacity-75 hover:bg-neutral-800/40' : 'border-l-2 border-amber-400 bg-neutral-950/60 hover:bg-neutral-800/70',
                    canOpen ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/70' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-[10px] font-bold uppercase text-neutral-200">
                      {getNotificationAuthor(notification).slice(0, 2)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs leading-snug">
                        <span className="mr-1 font-bold text-neutral-100">
                          {isAdministrative ? getNotificationAuthor(notification) : notification.title}
                        </span>
                        {isAdministrative ? (
                          <span className="text-neutral-300">enviou:</span>
                        ) : (
                          <span className="text-neutral-400">
                            {getNotificationAuthor(notification)}
                          </span>
                        )}
                      </div>

                      <p
                        className={[
                          'mt-0.5 text-xs italic text-neutral-400',
                          isAdministrative && canExpandMessage ? 'line-clamp-2' : '',
                        ].join(' ')}
                      >
                        "{notification.message}"
                      </p>

                      <div className="mt-1 flex items-center space-x-2 text-[10px] text-neutral-500">
                        <span
                          className={[
                            'flex items-center space-x-1',
                            canOpen ? 'text-emerald-400' : 'text-neutral-400',
                          ].join(' ')}
                        >
                          {getNotificationIcon(notification)}
                          <span>{getNotificationActionLabel(notification)}</span>
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(notification.createdAt)}</span>
                      </div>
                    </div>

                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={isAdministrative ? 'TempleSale' : notification.title}
                        className="h-11 w-11 shrink-0 rounded-lg border border-neutral-700/80 object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-neutral-700/80 bg-neutral-950 text-neutral-400">
                        {getNotificationIcon(notification)}
                      </div>
                    )}
                  </div>

                  {isAdministrative && canExpandMessage && (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpandedNotificationIds((current) =>
                          current.includes(notification.id)
                            ? current.filter((id) => id !== notification.id)
                            : [...current, notification.id],
                        );
                      }}
                      className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-emerald-400 transition-colors hover:bg-neutral-800 hover:text-emerald-300"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      <span>{isExpanded ? 'Ocultar mensagem' : 'Ver mensagem'}</span>
                    </button>
                  )}

                  {isAdministrative && isExpanded && (
                    <div className="mt-2.5 rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-2.5 text-xs leading-relaxed text-neutral-200">
                      {notification.message}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
