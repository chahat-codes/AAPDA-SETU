interface SimulatedBadgeProps {
  label?: string;
  tooltip?: string;
}

export function SimulatedBadge({ label = 'Prototype Simulation (No Backend)', tooltip }: SimulatedBadgeProps) {
  return (
    <span 
      className="simulated-badge" 
      title={tooltip || 'This feature is simulated client-side for prototype demonstration without backend services'}
    >
      <span className="simulated-dot" />
      {label}
    </span>
  );
}

