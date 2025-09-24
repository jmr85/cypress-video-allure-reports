describe('Login test con Allure', () => {
  it('Debería fallar al loguearse con credenciales inválidas', () => {
    cy.visit('https://the-internet.herokuapp.com/login');

    cy.get('#username').type('usuario_invalido');
    cy.get('#password').type('clave_invalida');
    cy.get('button[type="submit"]').click();

    // Validación que forzamos a fallar
    cy.contains('You logged into a secure area!').should('be.visible');
  });

  it('Debería loguearse correctamente con credenciales válidas', () => {
    cy.visit('https://the-internet.herokuapp.com/login');
    cy.get('#username').type('tomsmith');
    cy.get('#password').type('SuperSecretPassword!');
    cy.get('button[type="submit"]').click();
    cy.contains('You logged into a secure area!').should('be.visible');
  });
});