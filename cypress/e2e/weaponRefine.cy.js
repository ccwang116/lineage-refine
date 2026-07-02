describe('主遊戲頁', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/login');
    cy.get('input').first().type('admin');
    cy.get('input').eq(1).type('admin');
    cy.contains('button', '登').click();
  });

  it('點擊歐林並按購買裝備', () => {
    cy.url().should('include', 'lineage');

    // 等遊戲場景初始化（game-hint 出現代表 Vue app 已 ready）
    cy.get('.game-hint', { timeout: 15000 }).should('exist');

    // 直接呼叫 lineage.html 掛在 window 上的 _talkToOlin()
    // （Olin 需玩家靠近才能點擊，e2e 環境無法走路，繞過移動直接觸發 dialog）
    cy.window().then((win) => win._talkToOlin());

    // 驗證對話框出現
    cy.get('.dialog-box').should('be.visible');
    cy.get('.dialog-npc-name').should('contain', '歐林 [雜貨商]');

    // 點選「購買裝備」
    cy.contains('.dialog-opt', '購買裝備').click();

    // 驗證商店開啟且預設在武器頁
    cy.get('.shop-panel').should('be.visible');
    cy.contains('.shop-tab.active', '⚔ 武器').should('exist');
    cy.contains('.shop-item', '大馬士革刀').should('be.visible');

    // 購買大馬士革刀 20 把
    cy.contains('.shop-item', '大馬士革刀').click();
    cy.get('.qty-ctrl input').clear().type('20');
    cy.contains('.confirm', '購買').click();

    // iframe helper：setting / cash_pay 都共用同一個 .setting-frame-iframe
    const getIframe = () =>
      cy.get('.setting-frame-iframe', { timeout: 10000 })
        .its('0.contentDocument.body').should('not.be.empty')
        .then((body) => cy.wrap(body));

    // 儲值 10 萬元
    cy.contains('.topup-btn', '儲值').click();
    getIframe().contains('.preset-btn', '10萬元').click();
    getIframe().contains('.pay-btn', '確認儲值').click();
// click 返回遊戲
    getIframe().contains('.back-btn', '返回遊戲').click();
    // 切到道具頁購買祝福武器卷軸，每次限 99 張，共買 3 次（= 990 張）
    cy.contains('.shop-tab', '道具').click();
    for (let i = 0; i < 3; i++) {
      cy.contains('.shop-item', '祝福武器卷軸').click();
      cy.get('.qty-ctrl input').clear().type('99');
      cy.contains('.confirm', '購買').click();
    }

    // 開啟背包確認有大馬士革刀
    cy.get('.bag-toggle').click();
    cy.get('[data-testid="inv-大馬士革刀"]').should('be.visible');

    // 配置：把最高精煉等級 slider 改成 20
    cy.contains('.topup-btn', '配置').click();
    getIframe()
      .find('.slider-row input[type="range"]').first()
      .invoke('val', 20).trigger('input').trigger('change');
    getIframe().contains('.hbtn', '儲存並返回').click();

    // 反覆精煉：成功繼續敲同一把，損毀後換下一把，直到背包裡沒有大馬士革刀為止
    let lastLevel = 0; // 記錄每把刀最後一次成功精煉的等級，損毀時才 log

    function refineLoop(maxTries = 200) {
      if (maxTries === 0) throw new Error('精煉嘗試次數已達上限');

      cy.get('[data-testid="inv-祝福武器卷軸"]').first().click();
      cy.get('[data-testid="inv-大馬士革刀"]').first().click();
      cy.get('.result-modal', { timeout: 5000 }).should('be.visible');

      cy.get('.result-title').then(($el) => {
        const titleText = $el.text();
        const isSuccess = titleText.includes('精 煉 成 功');
        const isDestroyed = titleText.includes('裝 備 損 毀');

        // 成功：靜默更新 lastLevel，不馬上 log
        if (isSuccess) {
          cy.get('[data-testid="result-enhance-level"]').invoke('text').then((t) => {
            lastLevel = parseInt(t.trim().replace('+', ''));
          });
        }

        // 損毀：此時 lastLevel 是這把刀生前最後成功的等級（isSuccess 為 false，上面不會更新）
        if (isDestroyed) {
          cy.log(`裝備損毀，最後精煉等級：+${lastLevel}`);
          lastLevel = 0; // 重置，為下一把刀準備
        }

        cy.get('.result-close').click();

        // 確認背包還有沒有刀；有就繼續，沒有就停
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="inv-大馬士革刀"]').length > 0) {
            refineLoop(maxTries - 1);
          }
        });
      });
    }

    refineLoop();
  });
});
