export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#0F5B45" />
      <path
        d="M40 21.2a12.6 12.6 0 1 0 0 21.6 14 14 0 1 1 0-21.6Z"
        fill="#FAFAF9"
      />
      <circle cx="43.5" cy="22" r="2.2" fill="#7FE0B8" />
    </svg>
  )
}
