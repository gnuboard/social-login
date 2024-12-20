const NaverIcon = ({ className = '' }: { className?: string }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M16.273 12.845L7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727v12.845z"
      fill="currentColor"
    />
  </svg>
);

export default NaverIcon; 