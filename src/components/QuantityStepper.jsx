export function QuantityStepper({
  value,
  onChange,
  min = 1,
  className = "",
}) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : min;

  const applyValue = (nextValue) => {
    const parsed = Number(nextValue);
    if (Number.isNaN(parsed)) {
      onChange(min);
      return;
    }
    onChange(Math.max(min, Math.trunc(parsed)));
  };

  return (
    <div className={`qty-stepper ${className}`.trim()}>
      <button
        type="button"
        className="qty-btn"
        onClick={() => applyValue(safeValue - 1)}
        disabled={safeValue <= min}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <input
        className="qty-value-input"
        type="number"
        min={min}
        value={safeValue}
        onChange={(event) => applyValue(event.target.value)}
        aria-label="Quantity"
      />
      <button
        type="button"
        className="qty-btn"
        onClick={() => applyValue(safeValue + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
