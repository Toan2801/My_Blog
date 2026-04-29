import { Metadata } from 'next';
import { getVideos } from '@/lib/video-data';

export const metadata: Metadata = {
  title: 'Video Lịch Sử',
  description: 'Kho lưu trữ video bài giảng và tư liệu lịch sử.',
};

// Helper to convert watch URL to embed URL
function getEmbedUrl(url: string) {
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/');
  }
  return url;
}

export default function VideoPage() {
  const videos = getVideos();

  return (
    <div className="video-page container py-12">
      <header className="page-header text-center mb-16">
        <h1 className="display-font text-5xl mb-6">Thư viện</h1>
        <p className="text-ink-muted max-w-2xl mx-auto text-lg">
          Một số video về lịch sử và âm nhạc
        </p>
        <div className="divider-gold-center"></div>
      </header>

      {videos.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-dashed border-border rounded-xl">
          <p className="text-ink-muted">Chưa có video nào trong thư viện. Vui lòng quay lại sau.</p>
        </div>
      ) : (
        <div className="video-grid grid grid-cols-1 md:grid-cols-2 gap-12">
          {videos.map(video => (
            <div key={video.id} className="video-card bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="video-wrapper">
                <iframe
                  src={getEmbedUrl(video.url)}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-8">
                <h3 className="display-font text-2xl mb-3 text-ink">{video.title}</h3>
                <p className="text-ink-light leading-relaxed">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
