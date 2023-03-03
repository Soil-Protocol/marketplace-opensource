export const Routes = {
  // Hide Sidebar on these paths
  SIDEBAR_HIDDEN: ['/login', '/register', '/terms', '/forget-password'],

  // No authentication needed
  PUBLIC: ['/login', '/register', '/terms', '/forget-password'],

  // Blocked for authenticated users
  UNAUTHENTICATED_ONLY: ['/login', '/register'],
}
