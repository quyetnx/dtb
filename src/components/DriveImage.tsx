// Smart image component for Drive-hosted images.
// Uses ?w= resizing for smaller payloads + srcset for responsive delivery.
interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fileId: string
  // Hint for the default src size (pixels). Defaults to 800.
  defaultWidth?: 400 | 800 | 1200
  // sizes attribute for responsive selection (CSS media query string)
  sizes?: string
}

const SRCSET_WIDTHS = [400, 800, 1200] as const

export default function DriveImage({
  fileId,
  defaultWidth = 800,
  sizes = '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 800px',
  loading = 'lazy',
  ...rest
}: Props) {
  const base = `/api/drive/image?id=${fileId}`
  const src = `${base}&w=${defaultWidth}`
  const srcSet = SRCSET_WIDTHS.map((w) => `${base}&w=${w} ${w}w`).join(', ')

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      loading={loading}
      decoding="async"
      {...rest}
    />
  )
}
