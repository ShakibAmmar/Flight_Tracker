export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    day: days[date.getDay()],
    date: `${date.getDate()} ${months[date.getMonth()]}'${String(date.getFullYear()).slice(2)}`
  };
};