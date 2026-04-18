function Pager({ currentPage, totalPages, onPageChange }) {
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);

  const base = "px-3 py-1 text-sm border rounded";

  const getClass = (active, disabled) =>
    active
      ? `${base} bg-blue-500 text-white border-blue-500`
      : disabled
      ? `${base} text-gray-400 border-gray-200 cursor-not-allowed`
      : `${base} text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer`;

  const items = [];

  const add = (label, page, { active = false, disabled = false } = {}) => {
    items.push(
      <button
        key={`${label}-${page}`}
        disabled={disabled}
        onClick={() => !disabled && onPageChange(page)}
        className={getClass(active, disabled)}
      >
        {label}
      </button>
    );
  };

  add("«", currentPage - 1, {
    disabled: currentPage === 1,
  });

  for (let i = start; i <= end; i++) {
    add(i, i, {
      active: i === currentPage,
    });
  }

  add("»", currentPage + 1, {
    disabled: currentPage === totalPages,
  });

  return <div className="flex justify-center gap-2 mt-4">{items}</div>;
}

export default Pager;