/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package examenut9productos;
import java.io.*;
import java.util.Iterator;
/**
 *
 * @author flavio
 */
public class GestorMovimientos {
    
    private ListaProductos lista;
    private ObjectInputStream lector;
    private ObjectOutputStream escritor;
    private BufferedReader BR;
    
    public GestorMovimientos(){
        try{
            this.lista = new ListaProductos();
            this.lector = new ObjectInputStream(new FileInputStream("productos.txt"));
            this.escritor = new ObjectOutputStream(new FileOutputStream("productosModificados.txt"));
            this.BR = new BufferedReader(new FileReader("movimientos.txt"));
        }catch(FileNotFoundException e){
            System.out.println("Archivo no encontrado");
        }catch(IOException e){
            System.out.println("Error E/S");
        }
    }
    
    public void leerProductos(){
        try{
            while(this.BR.ready()) this.lista.addProducto((Producto)this.lector.readObject());
            System.out.println(this.lista);
        }catch(FileNotFoundException e){
            System.out.println("Archivo no encontrado");
        }catch(IOException e){
            System.out.println("Error E/S");
        }catch(ClassNotFoundException e){
            System.out.println("Error Referencial");
        }
    }
    
    public void cargarMovimientos(){
        try{
            while(this.BR.ready())procesarLinea(this.BR.readLine());
        }catch(FileNotFoundException e){
            System.out.println("Archivo no encontrado");
        }catch(IOException e){
            System.out.println("Error E/S");
        }catch(ProductoNoExisteExcepcion e){
            System.out.println(e.getMessage());
        }
    }
    
    private void procesarLinea(String producto) throws ProductoNoExisteExcepcion{
       try{
           if (this.lista.buscarProducto(producto) != -1) this.escritor.write(this.lista.buscarProducto(producto));
           else throw new ProductoNoExisteExcepcion();
       }catch(IOException e){
           System.out.println("ERROR E/S");
       }
    }
    
    public void guardarProductos(){
        try{
            Iterator iterar = this.lista.getProductos().iterator();
            while(iterar.hasNext())this.escritor.writeObject(iterar.next());
        }catch(IOException e){
            System.out.println("ERROR E/S");
        }
    }
    
}
