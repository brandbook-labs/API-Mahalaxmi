const formatDate = (dateInput) => {  
  if (!dateInput) return '';

  // Handle both string and Date types
  const dateStr =
    typeof dateInput === 'string'
      ? dateInput.split('T')[0] // take only 'YYYY-MM-DD'
      : dateInput.toISOString().split('T')[0];

  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${day} ${months[parseInt(month, 10) - 1]} ${year.slice(2)}`;
};

module.exports = formatDate;