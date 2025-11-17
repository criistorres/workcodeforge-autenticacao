<script>
  import { onMount } from 'svelte';
  import Router from 'svelte-spa-router';
  import { userStore } from './stores/userStore';
  import Login from './routes/Login.svelte';
  import AdminLogin from './routes/admin/AdminLogin.svelte';
  import Dashboard from './routes/admin/Dashboard.svelte';
  import UserList from './routes/admin/UserList.svelte';
  import CreateUser from './routes/admin/CreateUser.svelte';
  import UserDetail from './routes/admin/UserDetail.svelte';
  import MapList from './routes/admin/MapList.svelte';
  import MyProfile from './routes/admin/MyProfile.svelte';
  import EditProfile from './routes/admin/EditProfile.svelte';

  const routes = {
    '/': Login,
    '/admin/login': AdminLogin,
    '/admin': Dashboard,
    '/admin/users': UserList,
    '/admin/users/new': CreateUser,
    '/admin/users/:id': UserDetail,
    '/admin/maps': MapList,
    '/admin/profile': MyProfile,
    '/admin/profile/edit': EditProfile,
  };

  onMount(async () => {
    // Carregar usuário automaticamente se houver userId no localStorage
    const userId = localStorage.getItem('userId');
    if (userId && !$userStore.user) {
      await userStore.loadCurrentUser();
    }
  });
</script>

<Router {routes} />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
</style>
