import React from "react"

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  online?: boolean
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  online = false,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  }

  const onlineIndicatorSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          overflow-hidden 
          bg-muted 
          flex 
          items-center 
          justify-center 
          font-medium 
          text-muted-foreground
        `}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <span className="uppercase">
            {fallback || alt.charAt(0)}
          </span>
        )}
      </div>
      
      {/* Online Indicator */}
      {online && (
        <span
          className={`
            absolute 
            bottom-0 
            right-0 
            ${onlineIndicatorSizes[size]} 
            bg-success 
            rounded-full 
            border-2 
            border-background
          `}
        />
      )}
    </div>
  )
}
