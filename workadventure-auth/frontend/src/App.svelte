<script>
  import Router from 'svelte-spa-router';
  import Login from './routes/Login.svelte';
  import AdminLogin from './routes/admin/AdminLogin.svelte';
  import Dashboard from './routes/admin/Dashboard.svelte';
  import UserList from './routes/admin/UserList.svelte';
  import UserDetail from './routes/admin/UserDetail.svelte';

  const routes = {
    '/': Login,
    '/admin/login': AdminLogin,
    '/admin': Dashboard,
    '/admin/users': UserList,
    '/admin/users/:id': UserDetail,
  };
</script>

<Router {routes} />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
</style>
