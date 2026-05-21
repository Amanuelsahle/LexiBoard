import toast from "react-hot-toast";

export const handleLogOut = (setIsAuthenticated, setBoardData) => {
  localStorage.removeItem("supabase_session_token");
  setIsAuthenticated(false);
  setBoardData({ tasks: {}, columns: {}, columnOrder: [] });
  toast.success("Logged out successfully.");
};
