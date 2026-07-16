/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package examenut9productos;

/**
 *
 * @author flavio
 */
public class ProductoNoExisteExcepcion extends Exception {
    
    private String message;
    
    public ProductoNoExisteExcepcion(){
        this.message = "SIN STOCK";
    }
    
    public String getMessage(){
        return this.message;
    }
}
