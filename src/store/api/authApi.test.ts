// import { setupApiStore } from '@reduxjs/toolkit/query/react';
// import { authApi } from './authApi';
// import { rest } from 'msw';
// import { setupServer } from 'msw/node';

// const server = setupServer(
//   rest.post('https://your.api.url/api/v1/auth/login', (req, res, ctx) => {
//     return res(ctx.json({ accessToken: 'token', refreshToken: 'refresh', user: { id: 1, email: 'test@example.com' } }));
//   }),
//   rest.post('https://your.api.url/api/v1/auth/logout', (req, res, ctx) => {
//     return res(ctx.status(200));
//   })
// );

// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// describe('authApi', () => {
//   it('login mutation works', async () => {
//     const storeRef = setupApiStore(authApi);
//     const result = await storeRef.store.dispatch(
//       authApi.endpoints.login.initiate({ email: 'test@example.com', password: '123' })
//     );
//     expect(result.data).toHaveProperty('accessToken', 'token');
//     expect(result.data).toHaveProperty('user.email', 'test@example.com');
//   });

//   it('logout mutation works', async () => {
//     const storeRef = setupApiStore(authApi);
//     const result = await storeRef.store.dispatch(
//       authApi.endpoints.logout.initiate()
//     );
//     expect(result.status).toBe('fulfilled');
//   });
// });
