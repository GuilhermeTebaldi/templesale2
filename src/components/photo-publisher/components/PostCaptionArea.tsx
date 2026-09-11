import React from 'react';

interface PostCaptionAreaProps {
  caption: string;
  onChangeCaption: (caption: string) => void;
}

const QUICK_EMOJIS = ['✨', '📸', '🌴', '🔥', '❤️', '☕', '🚀', '🙌'];

export const PostCaptionArea: React.FC<PostCaptionAreaProps> = ({
  caption,
  onChangeCaption,
}) => {
  const handleAddEmoji = (emoji: string) => {
    onChangeCaption(caption + emoji);
  };

  return (
    <div className="w-full bg-neutral-900 border-t border-neutral-800/80 p-3.5 space-y-2.5">
      {/* Caption Input */}
      <div className="relative">
        <textarea
          id="post-caption-textarea"
          rows={2}
          maxLength={300}
          autoFocus
          value={caption}
          onChange={(e) => onChangeCaption(e.target.value)}
          placeholder="Escreva uma legenda..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none transition leading-relaxed"
        />
        <div className="absolute right-2.5 bottom-2 text-[10px] text-neutral-500">
          {caption.length}/300
        </div>
      </div>

      {/* Quick emoji inserts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {QUICK_EMOJIS.map((emoji, index) => (
          <button
            key={index}
            type="button"
            id={`quick-emoji-${index}`}
            onClick={() => handleAddEmoji(emoji)}
            className="text-sm p-1 rounded-md hover:bg-neutral-800 transition active:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
