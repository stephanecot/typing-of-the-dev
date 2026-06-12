/* Boot : attend le chargement de la police VT323 (sinon Phaser mesure mal les
   textes) et génère la texture de particule. Aucun autre asset à charger. */
'use strict';

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // texture 4x4 blanche pour les particules (teintée à l'emploi)
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('px', 4, 4);
    g.destroy();

    const loading = this.add.text(GAME_W / 2, GAME_H / 2, 'BOOTING...', {
      fontFamily: 'monospace', fontSize: '40px', color: CSS.greenDim,
    }).setOrigin(0.5);

    Promise.all([
      document.fonts.load('20px "VT323"'),
      document.fonts.ready,
    ]).finally(() => {
      loading.destroy();
      this.scene.start('Menu');
    });
  }
}
