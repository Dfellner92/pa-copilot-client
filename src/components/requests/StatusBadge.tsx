export const StatusBadge = ({ status }: { status: string }) => {
  const s = status.toLowerCase();
  const color =
    s === "approved"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
      : s === "denied"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
      : s === "pending"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
      : s === "requested"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
      : s === "not-required"
      ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
      : "";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
};
