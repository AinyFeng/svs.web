import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {UserService} from '@tod/uea-auth-lib';
import {
  DateUtils,
  DicDataService,
  LOCAL_STORAGE,
  SelectDistrictComponent,
  VacStockStorageApi,
  VacStockApprovalApiService
} from '@tod/svs-common-lib';
import {NzModalService} from 'ng-zorro-antd';
import {LocalStorageService} from '@tod/ngx-webstorage';
import {NotifierService} from 'angular-notifier';
import {take} from 'rxjs/operators';
import {VaccineStockInfoComponent} from '../../../stock-shared/components/vaccine-stock-info/vaccine-stock-info.component';
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';

@Component({
  selector: 'uea-batch-distribute',
  templateUrl: './batch-distribute.component.html',
  styleUrls: ['./batch-distribute.component.scss']
})
export class BatchDistributeComponent implements OnInit {

  /**
   * 出库单表单
   */
  orderForm: FormGroup;
  /**
   * 当天
   */
  today = new Date();
  /**
   * 门诊信息
   */
  povInfo: any;
  /**
   * 用户信息
   */
  userInfo: any;
  /**
   * 已选择的树节点
   */
  selectedNode: any;

  /**
   * 疫苗运输方式
   */
  transportationOptions: any;
  /**
   * 冷藏方式类型选项
   */
  refrigerateTypeOptions: any;
  /**
   * 库存余量数据
   */
  stockData = [];
  /**
   * 当前编辑项
   */
  editId: string;
  /**
   * 订阅集合
   */
  readonly subscription: Subscription[] = [];
  /**
   * 出库数量统计
   */
  total = 0;
  updateOrderDate: any;

  constructor(private fb: FormBuilder,
              private userSvc: UserService,
              private dicSvc: DicDataService,
              private modalService: NzModalService,
              private localSt: LocalStorageService,
              private vasStockStorageApiSvc: VacStockStorageApi,
              private notifierService: NotifierService,
              public route: ActivatedRoute,
              private vacStockApprovalSvc: VacStockApprovalApiService,
              private location: Location,
  ) {
    // 跳转传来的参数
    const sub = this.route.queryParams.subscribe(resp => {
      if (resp.hasOwnProperty('orderNo')) {
        this.updateOrderDate = resp;
        // 查看疫苗详情
        this.queryDetail();
      }
    });
    this.subscription.push(sub);

    this.orderForm = fb.group({
      orderDate: [this.today, [Validators.required]], // 出库订单时间，入库日期
      orderType: ['7', [Validators.required]], // 类型
      supplyorgName: [null, [Validators.required]], // 供货单位名称
      consignorName: [null, [Validators.required]], // 供货单位经手人
      supplyorgCode: [null, [Validators.required]], // 供货单位编码
      receiveorgName: [null, [Validators.required]], // 收货单位
      consigneeName: [null, [Validators.required]], // 收货单位经手人
      receiveorgCode: [null, [Validators.required]], // 收货单位编码
      transportation: ['1', [Validators.required]], // 疫苗运输方式
      otherTransportation: [null], // 疫苗运输方式其它
      refrigerateType: ['1', [Validators.required]], // 冷藏方式
      otherRefrigerateType: [null, [Validators.required]], // 冷藏方式其它
      memo: [], // 备注信息
      createBy: [null, [Validators.required]], // 创建人
      createorgName: [null, [Validators.required]], // 录入单位
      entrystaffName: [null, [Validators.required]], // 录入人姓名
      createorgCode: [null, [Validators.required]], // 录入单位编码
      vaccineType: ['0', [Validators.required]], // 疫苗类型
    });
    this.userSvc.getUserInfoByType().subscribe(user => {
      this.userInfo = user;
      if (user) {
        this.orderForm.get('consignorName').setValue(this.userInfo.name);
      }
    });
  }

  // 查看详情
  queryDetail() {
    const params = {
      serialCode: this.updateOrderDate.serialCode,
    };
    this.stockData = [];
    this.vacStockApprovalSvc.queryStockApprovalDetail(params, resp => {
      console.log('结果', resp);
      if (!resp || resp.code !== 0 || !resp.hasOwnProperty('data')) {
        return;
      }
      this.stockData = resp.data;
    });
  }

  ngOnInit() {
    this.povInfo = this.localSt.retrieve(LOCAL_STORAGE.VACC_POV);
    if (this.povInfo) {
      this.orderForm.get('supplyorgName').setValue(this.povInfo.name);
      this.orderForm.get('supplyorgCode').setValue(this.povInfo.povCode);
    }
    this.transportationOptions = this.dicSvc.getDicDataByKey('transportationType');
    this.refrigerateTypeOptions = this.dicSvc.getDicDataByKey('refrigerateType');

    const sub1 = this.orderForm.get('refrigerateType').valueChanges.subscribe(type => {
      // 冷藏类型为其他
      if (type === '3') {
        this.orderForm.get('otherRefrigerateType').setValidators(Validators.required);
        this.orderForm.get('otherRefrigerateType').markAsDirty();
      } else {
        this.orderForm.get('otherRefrigerateType').clearValidators();
        this.orderForm.get('otherRefrigerateType').markAsPristine();
      }
      this.orderForm.get('otherRefrigerateType').updateValueAndValidity();
    });
    this.subscription.push(sub1);

    const sub2 = this.orderForm.get('transportation').valueChanges.subscribe(type => {
      // 运输类型为其他
      if (type === '3') {
        this.orderForm.get('otherTransportation').setValidators(Validators.required);
        this.orderForm.get('otherTransportation').markAsDirty();
      } else {
        this.orderForm.get('otherTransportation').clearAsyncValidators();
        this.orderForm.get('otherTransportation').markAsPristine();
      }
      this.orderForm.get('otherTransportation').updateValueAndValidity();
    });
    this.subscription.push(sub2);
  }

  disabledDate = (d: Date) => {
    return d > this.today;
  }

  /**
   * 选择库存余量
   */
  selectStockData() {
    const modal = this.modalService.create({
      nzTitle: '库存列表',
      nzContent: VaccineStockInfoComponent,
      nzComponentParams: {
        selectedVacData: JSON.parse(JSON.stringify(this.stockData))
      },
      nzWidth: '1300px',
      nzFooter: null
    });

    modal.afterClose.pipe(take(1)).subscribe(res => {
      if (res) {
        res.forEach(r => {
          const vac = this.stockData.find(b => b['inventorySerialCode'] === r['inventorySerialCode']);
          if (!vac) {
            r['vaccNum'] = 0;
            r['sellPrice'] = 0;
            this.stockData.push(r);
          }
        });
        this.stockData = [...this.stockData];
        this.calculateTotal();
      }
    });
  }

  /**
   * 出库操作
   */
  submitForm(): void {
    // 表单填写
    this.fillInForm();
    for (const i in this.orderForm.controls) {
      if (this.orderForm.controls[i]) {
        this.orderForm.controls[i].markAsDirty();
        this.orderForm.controls[i].markAsTouched();
        this.orderForm.controls[i].updateValueAndValidity();
      }
    }
    // 检查冷藏方式和运输方式
    console.log(this.orderForm);
    if (this.orderForm.invalid) {
      this.modalService.warning({
        nzTitle: '提示',
        nzContent: `<p>表格填写不完整，请检查</p>`,
        nzMaskClosable: true
      });
      return;
    }
    // 检查疫苗填写数量是否有效和是否选择
    if (!this.checkStorageNumSelectedAndValid()) {
      return;
    }
    const params = this.orderForm.value;
    // 填写疫苗信息
    const vaccInfo = this.fillInVaccineInfo();
    params['queryInventoryLevelsOutparam'] = [...vaccInfo];
    params['orderDate'] = DateUtils.getFormatTime(params['orderDate']);
    console.log('出库参数', params);

    // 填写疫苗库存信息
    this.vasStockStorageApiSvc.outOfStock(params, res => {
      console.log('疫苗出库返回值', res);
      if (res.code === 0) {
        this.notifierService.notify('success', '出库成功');
        this.resetTable();
      } else {
        this.notifierService.notify('error', res.msg);
      }
    });
  }

  resetTable() {
    this.stockData = [];
  }

  /**
   * 停止编辑
   * @param data
   */
  stopEdit(data?: any) {
    this.editId = null;
    this.calculateTotal();
  }

  /**
   * 设置选中状态
   * @param temp
   */
  setFocus(temp: any) {
    temp.focus();
  }

  /**
   * 编辑单元格
   * @param id
   * @param event
   */
  startEdit(id: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.editId = id;
  }

  /**
   * 检查是否选择了疫苗
   */
  checkStorageNumSelectedAndValid() {
    // 检查是否选择
    if (this.stockData.length === 0) {
      this.modalService.warning({
        nzTitle: '提示',
        nzContent: `<p>请选择疫苗</p>`,
        nzMaskClosable: true
      });
      return false;
    }

    // 检查出库数量有效性
    const dv = this.stockData.filter(b => !b.hasOwnProperty('vaccNum') || !b.vaccNum || b.vaccNum === 0);
    if (dv.length > 0) {
      this.modalService.warning({
        nzTitle: '消息提示',
        nzContent: `<p>出库数量不可为0，请重新填写</p>`,
        nzMaskClosable: true
      });
      return false;
    }

    // 检查出库数量是否大于已有库存
    const numRet = this.stockData.some(sd => {
      // 出库数量
      const vaccNum = sd['vaccNum'];
      // 可用库存
      const storenumF = Number(sd['storenumF']);
      return vaccNum > storenumF;
    });
    if (numRet) {
      this.modalService.warning({
        nzTitle: '消息提示',
        nzContent: `<p>出库数量必须要在可用库存范围内，请重新填写</p>`,
        nzMaskClosable: true
      });
      return false;
    }

    // 检查出库数量与最小分包数量的比例关系
    const smallPackageRet = this.stockData.filter(sd => {
      if (sd.hasOwnProperty('smallPackage') && sd['smallPackage']) {
        const smp = sd['smallPackage'];
        const vacNum = sd['vaccNum'];
        if (smp % vacNum !== 0) {
          return sd;
        }
      }
    });
    if (smallPackageRet.length > 0) {
      let vacName = '';
      smallPackageRet.forEach(spr => {
        vacName += spr['vaccName'] + '/';
      });
      this.modalService.warning({
        nzTitle: '消息提示',
        nzContent: `<p>${vacName} - 出库数量必须要与最小分报数成正比关系，请重新填写</p>`,
        nzMaskClosable: true
      });
      return false;
    }

    // 检查疫苗类型 一类 - 0，二类 - 1
    const vaccineType = this.orderForm.get('vaccineType').value;
    // 判断每一个疫苗批号信息中的类型与订单主表类型是否一致
    const typeRet = this.stockData.every(b => b.vaccineType === vaccineType);
    if (!typeRet) {
      this.modalService.warning({
        nzTitle: '消息提示',
        nzContent: `<p>订单的【疫苗类型】与所选疫苗的【属性】不一致</p>`,
        nzMaskClosable: true
      });
      return false;
    }
    // 当疫苗类型为二类时，成本价格或者售出价格不可为空
    if (vaccineType === '1') {
      const priceRet = this.stockData.some(b => b['sellPrice'] === 0);
      if (priceRet) {
        this.modalService.warning({
          nzTitle: '消息提示',
          nzContent: `<p>【出售价格】不可为空</p>`,
          nzMaskClosable: true
        });
        return false;
      }
    }
    return true;
  }

  /**
   * 填写表单必要信息
   */
  fillInForm() {
    // 填写录入人相关信息，录入人为当前系统登录用户
    this.orderForm.get('createorgName').patchValue(this.userInfo.name); // 录入单位名称
    this.orderForm.get('entrystaffName').patchValue(this.userInfo.name); // 录入人名称
    this.orderForm.get('createorgCode').patchValue(this.userInfo.pov); // 录入单位编码

    // 创建人
    this.orderForm.get('createBy').patchValue(this.userInfo.userCode);
  }

  /**
   * 填写疫苗库存信息
   */
  fillInVaccineInfo() {
    const stockData = [];
    this.stockData.forEach(sd => {
      sd['loseEfficacyDate'] = DateUtils.getFormatDateTime(sd['loseEfficacyDate']);
      stockData.push(sd);
    });
    return stockData;
  }

  /**
   * 移除疫苗
   */
  remove(data: any) {
    this.stockData = this.stockData.filter(sd => sd['batchSerialCode'] !== data['batchSerialCode']);
    this.calculateTotal();
  }

  /**
   * 计算出入库数量
   */
  calculateTotal() {
    this.total = 0;
    this.stockData.forEach(d => this.total += d['vaccNum']);
  }

  // 返回
  goBack() {
    this.location.back();
  }
}
