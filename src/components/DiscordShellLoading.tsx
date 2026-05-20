interface Props {
  message?: string;
}

export default function DiscordShellLoading({ message = 'Dang tai noi dung...' }: Props) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-subtle"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="size-10 animate-spin rounded-full border-4 border-solid border-normal border-t-themed"
        aria-hidden="true"
      />
      <p className="m-0 text-base text-subtle">{message}</p>
    </div>
  );
}