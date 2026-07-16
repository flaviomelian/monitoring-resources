/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package examenut9productos;

import java.io.Serializable;

/**
 *
 * @author mariajo
 */
public class Producto implements Serializable{
    private String codigo;
    private String nombre;
    private double precio;
    private int stock;

    public Producto(String codigo, String nombre, double precio, int stock) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.precio = precio;
        this.stock = stock;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public double getPrecio() {
        return precio;
    }

    public int getStock() {
        return stock;
    }

    public void actualizarStock(int cantidad) {
        this.stock +=cantidad;
    }

    @Override
    public String toString() {
        return "Producto{" + "codigo=" + codigo + ", nombre=" + nombre + ", precio=" + precio + ", stock=" + stock + '}';
    }

    @Override
    public boolean equals(Object o)
    {
        Producto p;
        if(o instanceof Producto)
        {
            p=(Producto)o;
            return codigo.equals(p.getCodigo());
            
        }
        return false;
            
    }
    
    
    
}
