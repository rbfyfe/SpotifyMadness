interface AlbumSpinProps {
  imageUrl: string;
}

export function AlbumSpin({ imageUrl }: AlbumSpinProps) {
  return (
    <div className="perspective-[800px]">
      <img
        src={imageUrl}
        alt="Champion's latest album"
        className="w-48 h-48 md:w-64 md:h-64 rounded-lg shadow-2xl album-spin object-cover"
      />
    </div>
  );
}
