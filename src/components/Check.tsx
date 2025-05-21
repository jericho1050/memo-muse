interface CheckIconProps extends React.SVGAttributes<SVGSVGElement> {
    size?: number | string;
  }
  
export function Check({ size = 24, className, ...rest }: CheckIconProps) {
    const iconSize = typeof size === 'string' ? parseInt(size, 10) : size;
    const finalSize = !isNaN(iconSize) && iconSize > 0 ? iconSize : 24;
  
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={finalSize}
        height={finalSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...rest}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  
