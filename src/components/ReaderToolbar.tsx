'use client';

interface Props {
  title: string;
  currentPage: number;
  totalPages: number;
  onBack: () => void;
  onPageChange: (page: number) => void;
  onFullscreen: () => void;
}

export default function ReaderToolbar({
  title,
  currentPage,
  totalPages,
  onBack,
  onPageChange,
  onFullscreen,
}: Props) {
  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (val >= 1 && val <= totalPages) {
        onPageChange(val);
      }
    }
  };

  return (
    <div className="reader-toolbar">
      <div className="reader-toolbar-left">
        <button className="reader-btn" onClick={onBack} title="Quay lại">
          ← Quay lại
        </button>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </span>
      </div>

      <div className="reader-toolbar-center">
        <span className="reader-page-indicator">
          Trang{' '}
          <input
            className="reader-page-input"
            type="number"
            min={1}
            max={totalPages}
            defaultValue={currentPage}
            key={currentPage}
            onKeyDown={handlePageInput}
            aria-label="Page number"
          />
          {' / '}{totalPages}
        </span>
      </div>

      <div className="reader-toolbar-right">
        <button className="reader-btn" onClick={onFullscreen} title="Toàn màn hình">
          ⛶
        </button>
      </div>
    </div>
  );
}
