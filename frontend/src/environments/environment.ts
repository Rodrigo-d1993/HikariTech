export const environment = {
  production: false,

  apiBaseUrl:     'https://52iq3voy8b.execute-api.us-east-1.amazonaws.com/test',
  pedidosBaseUrl: 'https://ncp6y73mt0.execute-api.us-east-1.amazonaws.com/test',
  adminBaseUrl:   'https://6b91dqiq83.execute-api.us-east-1.amazonaws.com/test',

  cognito: {
    userPoolId:       'us-east-1_FiIcrh4Jk',
    userPoolClientId: '1gd9dcsatj06co34dpfs8tcrq7',
    domain:           'us-east-1fiicrh4jk.auth.us-east-1.amazoncognito.com',
    redirectSignIn:   'http://localhost:4200/',
    redirectSignOut:  'http://localhost:4200/',
  }
};
