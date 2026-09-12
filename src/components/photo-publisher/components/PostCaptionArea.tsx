import React from 'react';

interface PostCaptionAreaProps {
  caption: string;
  onChangeCaption: (caption: string) => void;
}

export const PostCaptionArea: React.FC<PostCaptionAreaProps> = ({
  caption,
  onChangeCaption,
}) => {
  return (
    <div className="w-full bg-neutral-900 border-t border-neutral-800/80 p-3">
      {/* Caption Input */}
      <div className="relative">
        <textarea
          id="post-caption-textarea"
          rows={3}
          maxLength={300}
          value={caption}
          onChange={(e) => onChangeCaption(e.target.value)}
          placeholder="Escreva uma legenda..."
          className="max-h-24 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 p-3 pr-14 text-base leading-relaxed text-neutral-100 placeholder-neutral-500 transition focus:border-emerald-500 focus:outline-none sm:text-sm"
        />
        <div className="absolute right-2.5 bottom-2 text-[10px] text-neutral-500">
          {caption.length}/300
        </div>
      </div>
    </div>
  );
};
