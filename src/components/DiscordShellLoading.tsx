interface Props {
  message?: string;
}

export default function DiscordShellLoading({ message = 'Dang tai noi dung...' }: Props) {
  return (
    <div className="dc-shell-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="dc-shell-loading-spinner" aria-hidden="true" />
      <p className="dc-shell-loading-text">{message}</p>
    </div>
  );
}