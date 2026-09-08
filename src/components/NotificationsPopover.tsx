import React, { useEffect } from 'react';
import { Bell, CheckCheck, MessageCircle, X, Sparkles } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onSelectNotification: (notification: AppNotification) => void;
  onMarkAllAsRead: () => void;
  onSimulateComment?: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  onMarkAllAsRead,
  onSimulateComment,
}) => {
  // Lock background scrolling completely while notification drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = Date.now();
      const time = new Date(dateStr).getTime();
      const diffSec = Math.max(0, Math.floor((now - time) / 1000));
      if (diffSec < 60) return 'Agora';
      if (diffSec < 3600) return `Há ${Math.floor(diffSec / 60)} min`;
      if (diffSec < 86400) return `Há ${Math.floor(diffSec / 3600)} h`;
      const days = Math.floor(diffSec / 86400);
      return days === 1 ? 'Há 1 dia' : `Há ${days} dias`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id="notifications-backdrop"
      className="fixed inset-0 z-50 flex items-start sm:items-start justify-center sm:justify-end p-2 sm:p-4 pt-14 sm:pt-16 sm:pr-6 bg-black/60 backdrop-blur-xs overflow-hidden"
      onClick={onClose}
    >
      <div
        id="notifications-popover-card"
        className="w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in slide-in-from-top-2 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Sino */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-800/90 flex items-center justify-between bg-neutral-900 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-sm text-neutral-100">
                  Notificações
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-amber-400 text-neutral-950 font-bold text-[9px] px-1.5 py-0.2 rounded-full">
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
                className="text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 flex items-center space-x-1 transition-colors cursor-pointer"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar lidas</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fechar notificações"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informative Sub-header showing flow with test action */}
        <div className="bg-neutral-950/80 px-4 py-2 border-b border-neutral-800/80 text-[11px] text-neutral-400 flex items-center justify-between shrink-0">
          <span>Comentários em publicações</span>
          {onSimulateComment && (
            <button
              type="button"
              onClick={onSimulateComment}
              className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Simular Comentário</span>
            </button>
          )}
        </div>

        {/* Lista Rolável de Notificações: overscroll-contain impede que a página atrás se movimente */}
        <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-neutral-800/60 p-1">
          {notifications.length === 0 ? (
            <div className="py-12 px-6 text-center text-xs text-neutral-400 space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-neutral-800/60 mx-auto flex items-center justify-center text-neutral-400 mb-2">
                <Bell className="w-5 h-5" />
              </div>
              <p className="font-medium text-neutral-300">Nenhuma notificação por enquanto</p>
              <p className="text-[11px] text-neutral-500">
                Quando alguém comentar nas fotos da empresa, o sino avisará você aqui.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onSelectNotification(notif);
                  onClose();
                }}
                className={`p-3 rounded-xl flex items-center space-x-3 cursor-pointer transition-colors ${
                  notif.read
                    ? 'hover:bg-neutral-800/40 opacity-75'
                    : 'bg-neutral-950/60 hover:bg-neutral-800/70 border-l-2 border-amber-400'
                }`}
              >
                {/* User avatar indicator */}
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-[10px] text-neutral-200 shrink-0 uppercase">
                  {notif.authorName.slice(0, 2)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs leading-snug">
                    <span className="font-bold text-neutral-100 mr-1">
                      {notif.authorName}
                    </span>
                    <span className="text-neutral-300">comentou:</span>
                  </div>
                  <p className="text-xs text-neutral-400 italic line-clamp-1 mt-0.5">
                    "{notif.text}"
                  </p>
                  <div className="flex items-center space-x-2 text-[10px] text-neutral-500 mt-1">
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>Ver foto</span>
                    </span>
                    <span>•</span>
                    <span>{formatRelativeTime(notif.createdAt)}</span>
                  </div>
                </div>

                {/* Thumbnail of the post */}
                <img
                  src={notif.postImageUrl}
                  alt="Foto"
                  className="w-11 h-11 rounded-lg object-cover border border-neutral-700/80 shrink-0"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
