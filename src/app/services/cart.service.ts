import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ProductService } from "./product.service";
import { OrderService } from "./order.service";
import { environment } from "src/environments/environment";
import { CartModelPublic, CartModelServer } from "../models/cart";
import { BehaviorSubject } from "rxjs";
import { Router, NavigationExtras } from "@angular/router";
import { ProductModelServer } from "../models/product.model";
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
// import { privateDecrypt } from "crypto";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private serverURL = environment.SERVER_URL;

  // data variable to store the  cart infomation on the client's tocal storage
  private cartDataClient: CartModelPublic = {
    // CartModelPublic มาจาก models ทำงานจาก client
    total: 0,
    prodData: [
      {
        incart: 0,
        id: 0,
      },
    ],
  };

  // Data variable to store the cart information on the client's local storage

  private cartDataServer: CartModelServer = {
    //CartModelServer มาจาก models ทำงานจาก server
    total: 0,
    data: [
      {
        numInCart: 0,
        product: undefined,
      },
    ],
  };

  /* Observables for the components to subscribe */
  cartTotal$ = new BehaviorSubject<number>(0); //เป็นเหมือน state ค่าเริ่มต้น
  cartData$ = new BehaviorSubject<CartModelServer>(this.cartDataServer); //เป็นเหมือน state ค่าเริ่มต้น

  constructor(
    private http: HttpClient,
    private productService: ProductService,
    private orderService: OrderService,
    private router: Router,
    private toast: ToastrService,
    private spinner: NgxSpinnerService,
  ) {
    this.cartTotal$.next(this.cartDataServer.total);
    this.cartData$.next(this.cartDataServer);

    //Get the infomation local storage (if any)
    let info: CartModelPublic = JSON.parse(localStorage.getItem("cart"));

    //check if the info variable is null or has some data in it

    if (info != null && info != undefined && info.prodData[0].incart != 0) {
      //  Local Storage is not emty  and has some  infimation

      this.cartDataClient = info;

      // Loop through each entry and put it in the catdataServer object

      this.cartDataClient.prodData.forEach((p) => {
        this.productService
          .getSingleProduct(p.id)
          .subscribe((actualProductInfo: ProductModelServer) => {
            if ((this.cartDataServer.data[0].numInCart = 0)) {
              this.cartDataServer.data[0].numInCart = p.incart;
              this.cartDataServer.data[0].product = actualProductInfo;
              // TODO caeate Calculateotal Function and replace it here

              this.cartDataClient.total = this.cartDataServer.total;
              localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
            } else {
              // cartDataSErver aleady has some entry in it
              this.cartDataServer.data.push({
                numInCart: p.incart,
                product: actualProductInfo,
              });
              // todo create calculateTotal Function and replace it here
              // ตะกร้าของ client total =  ตะกร้าของ server total
              this.cartDataClient.total = this.cartDataServer.total;
              localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
            }
            this.cartData$.next({ ...this.cartDataServer });
          });
      });
    }
  }
  CalculateSubTotal(index): Number {
    let subTotal = 0;

    let p = this.cartDataServer.data[index];
    // @ts-ignore
    subTotal = p.product.price * p.numInCart;

    return subTotal;


  }

  //เพิ่มสินค้าในตะกร้า

  AddProductTocart(id: number, quantity?: number) {
    this.productService.getSingleProduct(id).subscribe((prod) => {
      //1. ถ้าตะกร้าว่างไม่มีสินค้า
      if (this.cartDataServer.data[0].product === undefined) {
        this.cartDataServer.data[0].product = prod;
        this.cartDataServer.data[0].numInCart = quantity !== undefined ? quantity : 1;
        this.CalculateTotal();

        //TODO calculate total amount สิ่งที่ต้องทำคำนวณยอดรวม
        this.cartDataClient.prodData[0].incart = this.cartDataServer.data[0].numInCart;
        this.cartDataClient.prodData[0].id = prod.id;
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
        this.cartData$.next({ ...this.cartDataServer });

        //TODO display a toast notification -> สิ่งที่ต้องทำแสดงการแจ้งเตือน
        this.toast.success(`${prod.name} added to the cart.`, 'Prodect added', {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        })
      }
      //2. if the cart has some item  -> หากรถเข็นมีบางรายการ
      else {
        let index = this.cartDataServer.data.findIndex(
          (p) => (p.product.id === prod.id)
        ); // -1 or apositive value
        // a. if that item is already in the cart -> index positive value -> หากรายการนั้นมีอยู่ในรถเข็นแล้ว

        if (index !== -1) {

          if (quantity !== undefined && quantity <= prod.quantity) {
            this.cartDataServer.data[index].numInCart = this.cartDataServer.data[index].numInCart < prod.quantity ? quantity : prod.quantity;
          } else {
            this.cartDataServer.data[index].numInCart < prod.quantity ? this.cartDataServer.data[index].numInCart++ : prod.quantity;
          }
          this.cartDataClient.prodData[index].incart = this.cartDataServer.data[index].numInCart;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));

          //TODO display a toast notification -> สิ่งที่ต้องทำแสดงการแจ้งเตือน
          this.toast.info(`${prod.name} quantity updated in the cart.`, 'Prodect Updated', {
            timeOut: 1500,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right'
          })


        } //END OF IF

        // if product is not the cart array

        // b. if that item is not in the cart -> หากรายการนั้นไม่ได้อยู่ในรถเข็น
        else {
          this.cartDataServer.data.push({
            numInCart: 1,
            product: prod,
          });

          this.cartDataClient.prodData.push({
            incart: 1,
            id: prod.id,

          });

          // TODO display a toast notification -> สิ่งที่ต้องทำแสดงการแจ้งเตือน
          this.toast.success(`${prod.name} added to the cart.`, 'Prodect added', {
            timeOut: 1500,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right'
          })


          //TODO calculate total amount สิ่งที่ต้องทำคำนวณยอดรวม
          this.CalculateTotal();
          this.cartDataClient.total = this.cartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
          this.cartData$.next({ ...this.cartDataServer })

        }  //End OF ELSE
      }
    });
  }

  UpdateCartData(index: number, increase: boolean) {
    // อัฟเดตสินค้าในตะกร้า

    let data = this.cartDataServer.data[index];

    if (increase) {

      data.numInCart < data.product.quantity ? data.numInCart++ : data.product.quantity;
      this.cartDataClient.prodData[index].incart = data.numInCart;

      //TODO calculate total amount สิ่งที่ต้องทำคำนวณยอดรวม
      this.CalculateTotal();
      this.cartDataClient.total = this.cartDataServer.total;
      localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
      this.cartData$.next({ ...this.cartDataServer })

    } else {
      data.numInCart--;


      if (data.numInCart < 1) {

        //Delete The Product from cart
        this.CalculateTotal();
        this.cartData$.next({ ...this.cartDataServer })

      } else {

        this.cartData$.next({ ...this.cartDataServer })
        this.cartDataClient.prodData[index].incart = data.numInCart;

        //TODO calculate total amount สิ่งที่ต้องทำคำนวณยอดรวม
        this.CalculateTotal();
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem("cart", JSON.stringify(this.cartDataClient));
      }
    }


  }

  // ลบสินค้าออกจากตระกร้า
  DeleteProductFromCart(index: number) {
    if (window.confirm(`Are you sure you want to remove the item ?`)) {
      this.cartDataServer.data.splice(index, 1);
      this.cartDataClient.prodData.splice(index, 1);
      this.CalculateTotal();

      //TODO calculate total amount สิ่งที่ต้องทำคำนวณยอดรวม
      this.cartDataClient.total = this.cartDataServer.total;

      if (this.cartDataClient.total === 0) {
        this.cartDataClient = { prodData: [{ incart: 0, id: 0 }], total: 0 };
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      } else {
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }

      if (this.cartDataServer.total === 0) {
        this.cartDataServer = { total: 0, data: [{ numInCart: 0, product: undefined }] }
        this.cartData$.next({ ...this.cartDataServer })
      } else {
        this.cartData$.next({ ...this.cartDataServer })
      }

    } else {
      // if the user clicks the  cancel button
      return;
    }
  }

  private CalculateTotal() {
    let Total = 0;

    this.cartDataServer.data.forEach(p => {
      const { numInCart } = p;
      const { price } = p.product;

      Total += numInCart * price;
    })

    this.cartDataServer.total = Total;
    this.cartTotal$.next(this.cartDataServer.total);
  }
  CheckoutFromCart(userId: Number) {

    this.http.post(`${this.serverURL}/orders/payment`, null).subscribe((res: { success: Boolean }) => {
      // console.clear();

      if (res.success) {
        this.resetServerData();
        this.http.post(`${this.serverURL}/orders/new`, {
          userId: userId,
          products: this.cartDataClient.prodData
        }).subscribe((data: OrderResponse) => {

          this.orderService.getSingleOrder(data.order_id).then(prods => {
            if (res.success) {
              const navigationExtras: NavigationExtras = {
                state: {
                  message: data.message,
                  products: prods,
                  orderId: data.order_id,
                  total: this.cartDataClient.total
                }
              };
              this.spinner.hide().then()
              this.router.navigate(['/thankyou'], navigationExtras).then(p => {
                this.cartDataClient = { total: 0, prodData: [{ incart: 0, id: 0 }] }
                this.cartTotal$.next(0)
                localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
              })
            }
          });

        })
      } else {
        this.spinner.hide().then();
        this.router.navigateByUrl('/checkout').then();
        this.toast.error(`Sorry, failed to book the order`, "Order Status", {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        })
      }
    })
  }

  // public CheckoutFromCart(userId: number) {
  //   this.http.post(`${this.serverURL}/orders/payment`, null).subscribe((res: { success: Boolean }) => {
  //     // console.clear();

  //     if (res.success) {

  //       this.resetServerData();

  //       this.http.post(`${this.serverURL}/orders/new`, {
  //         userId: userId,
  //         products: this.cartDataClient.prodData
  //       }).subscribe((data: OrderResponse) => {
  //         this.orderService.getSingleOrder(data.order_id).then(prods => {
  //           if (data.success) {
  //             const navigationExtras: NavigationExtras = {
  //               state: {
  //                 message: data.message,
  //                 products: prods,
  //                 orderId: data.order_id,
  //                 tatal: this.cartDataClient.total
  //               }
  //             }
  //             // Todo hide spinner
  //             this.spinner.hide().then()
  //             this.router.navigate(['/thankyou'], navigationExtras).then(p => {
  //               this.cartDataClient = { total: 0, prodData: [{ incart: 0, id: 0 }] }
  //               this.cartTotal$.next(0)
  //               localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
  //             })
  //           }
  //         })


  //       })
  //     } else {
  //       this.spinner.hide().then();
  //       this.router.navigateByUrl('/checkout').then();
  //       this.toast.error(`Sorry, failed to book the order`, "Order Status", {
  //         timeOut: 1500,
  //         progressBar: true,
  //         progressAnimation: 'increasing',
  //         positionClass: 'toast-top-right'
  //       })
  //     }
  //   })

  // }
  private resetServerData() {
    this.cartDataServer = {
      total: 0,
      data: [
        {
          numInCart: 0,
          product: undefined,
        }
      ]
    }
    this.cartData$.next({ ...this.cartDataServer })
  }


}

interface OrderResponse {
  order_id: number;
  success: boolean;
  message: string;
  products: [{
    id: string,
    numInCart: string
  }]
}