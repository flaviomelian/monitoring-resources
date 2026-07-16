/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package examenut9productos;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Objects;
/**
 *
 * @author flavio
 */
public class ListaProductos {
    
    private ArrayList<Producto> productos;
    
    public ListaProductos(){
        this.productos = new ArrayList<>();
    }

    public ArrayList<Producto> getProductos() {
        return productos;
    }

    public void setProductos(ArrayList<Producto> productos) {
        this.productos = productos;
    }
    
    public void addProducto(Producto producto){
        this.productos.add(producto);
    }
    
    public int buscarProducto(String codigo){
        Iterator iterar = this.productos.iterator();
        int posicion = -1;
        Producto current;
        while(iterar.hasNext()){
            current = (Producto)iterar.next(); posicion++;
            if (current.getCodigo().equals(codigo)) break;
        }
        return posicion;
    }

    @Override
    public String toString() {
        return "ListaProductos{" + "productos=" + productos + '}';
    }

    @Override
    public int hashCode() {
        int hash = 5;
        hash = 41 * hash + Objects.hashCode(this.productos);
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final ListaProductos other = (ListaProductos) obj;
        return Objects.equals(this.productos, other.productos);
    }
    
}
