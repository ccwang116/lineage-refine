describe('登入頁', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  it('帳號空白時顯示錯誤', () => {
    cy.contains('button', '登').click();
    cy.contains('請輸入遊戲帳號').should('be.visible');
  });

  it('密碼空白時顯示錯誤', () => {
    cy.get('input').first().type('testuser');
    cy.contains('button', '登').click();
    cy.contains('請輸入遊戲密碼').should('be.visible');
  });

  it('帳號少於 3 字元時顯示錯誤', () => {
    cy.get('input').first().type('ab');
    cy.get('input').eq(1).type('password');
    cy.contains('button', '登').click();
    cy.contains('帳號長度至少 3 個字元').should('be.visible');
  });

  it('登入成功後跳轉至主遊戲並寫入 localStorage', () => {
    cy.get('input').first().type('testuser');
    cy.get('input').eq(1).type('password123');
    cy.contains('button', '登').click();
    cy.url().should('include', 'lineage');
    cy.window().then((win) => {
      const player = JSON.parse(win.localStorage.getItem('lineage_player'));
      expect(player.name).to.equal('testuser');
      expect(player.loggedIn).to.be.true;
      expect(player.gold).to.equal(10000000);
    });
  });

  it('可切換伺服器並讓選取的伺服器被記入 localStorage', () => {
    cy.contains('愛神 邱比特').click();
    cy.get('input').first().type('testuser');
    cy.get('input').eq(1).type('password123');
    cy.contains('button', '登').click();
    cy.window().then((win) => {
      const player = JSON.parse(win.localStorage.getItem('lineage_player'));
      expect(player.server).to.equal('cupid');
    });
  });
});
