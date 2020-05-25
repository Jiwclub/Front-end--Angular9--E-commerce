import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Observable } from 'rxjs';
import { ProductModelServer, ServerResponse } from '../models/product.model';


@Injectable({
  providedIn: "root",
})
export class ProductService {
  SERVER_URL = environment.SERVER_URL;

  constructor(private http: HttpClient) {}

  /* This is to fetch all products from the backend server */

  getAllProducts(numberOfResults: number = 10): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(this.SERVER_URL + "/products", {
      params: {
        limit: numberOfResults.toString(),
      },
    });
  }

  /* GET single product from  server */

                              // Observable<ProductModelServer> เป็นตัว return
  getSingleProduct(id: Number): Observable<ProductModelServer> {
    return this.http.get<ProductModelServer>(this.SERVER_URL + '/products/' + id);
  }

  /* get products from one category */
  getProductsFromCategory(catName: string): Observable<ProductModelServer[]>{
    return this.http.get<ProductModelServer[]>(this.SERVER_URL + '/products/category/' + catName)
  }
  
}
