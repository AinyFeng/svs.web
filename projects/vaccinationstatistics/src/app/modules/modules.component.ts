import { Component, OnInit } from '@angular/core';
import { MODULE_MENU_ITEMS } from './modules-menu';
import { NbIconLibraries } from '@nebular/theme';
import {VacstatStartupService} from '@tod/svs-common-lib';

@Component({
  selector: 'mds-modules-component',
  styleUrls: ['modules.component.scss'],
  template: `
      <uea-page-portal [sidemenus]="menuItems">
          <router-outlet></router-outlet>
      </uea-page-portal>
  `,
  providers: []
})
export class ModulesComponent implements OnInit {
  menuItems = MODULE_MENU_ITEMS;

  constructor(
    private iconLibraries: NbIconLibraries,
    private startupSvc: VacstatStartupService,
  ) {
    iconLibraries.registerFontPack('fas', {
      packClass: 'fas',
      iconClassPrefix: 'fa'
    });
    iconLibraries.registerFontPack('ion', { iconClassPrefix: 'ion' });
    this.iconLibraries.setDefaultPack('fas');

  }

  ngOnInit(): void {
    this.startupSvc.start();
  }
}
