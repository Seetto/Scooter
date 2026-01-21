#!/usr/bin/env python3
"""
WiFi Network Monitor - GUI Application
Monitors network traffic and displays connected devices and their activity.
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import time
import socket
import psutil
import subprocess
import json
from datetime import datetime
from collections import defaultdict, deque
import queue
import sys
import os

class NetworkMonitor:
    def __init__(self, root):
        self.root = root
        self.root.title("WiFi Network Monitor")
        self.root.geometry("1200x800")
        self.root.configure(bg='#f0f0f0')
        
        # Data storage
        self.devices = {}
        self.traffic_log = deque(maxlen=1000)
        self.is_monitoring = False
        self.monitor_thread = None
        self.traffic_queue = queue.Queue()
        
        # Create GUI
        self.create_widgets()
        self.setup_network_interface()
        
        # Start GUI update loop
        self.update_gui()
        
    def create_widgets(self):
        """Create the main GUI widgets"""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)
        
        # Control panel
        control_frame = ttk.LabelFrame(main_frame, text="Control Panel", padding="5")
        control_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Start/Stop button
        self.start_button = ttk.Button(control_frame, text="Start Monitoring", 
                                      command=self.toggle_monitoring)
        self.start_button.grid(row=0, column=0, padx=(0, 10))
        
        # Network interface selection
        ttk.Label(control_frame, text="Interface:").grid(row=0, column=1, padx=(10, 5))
        self.interface_var = tk.StringVar()
        self.interface_combo = ttk.Combobox(control_frame, textvariable=self.interface_var,
                                          state="readonly", width=15)
        self.interface_combo.grid(row=0, column=2, padx=(0, 10))
        
        # Refresh interfaces button
        ttk.Button(control_frame, text="Refresh", 
                  command=self.refresh_interfaces).grid(row=0, column=3, padx=(0, 10))
        
        # Status label
        self.status_label = ttk.Label(control_frame, text="Status: Stopped", 
                                    foreground="red")
        self.status_label.grid(row=0, column=4, padx=(10, 0))
        
        # Statistics frame
        stats_frame = ttk.LabelFrame(main_frame, text="Network Statistics", padding="5")
        stats_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Stats labels
        self.device_count_label = ttk.Label(stats_frame, text="Devices: 0")
        self.device_count_label.grid(row=0, column=0, padx=(0, 20))
        
        self.packet_count_label = ttk.Label(stats_frame, text="Packets: 0")
        self.packet_count_label.grid(row=0, column=1, padx=(0, 20))
        
        self.bandwidth_label = ttk.Label(stats_frame, text="Bandwidth: 0 KB/s")
        self.bandwidth_label.grid(row=0, column=2, padx=(0, 20))
        
        # Main content area
        content_frame = ttk.Frame(main_frame)
        content_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))
        content_frame.columnconfigure(0, weight=1)
        content_frame.rowconfigure(0, weight=1)
        
        # Create notebook for tabs
        self.notebook = ttk.Notebook(content_frame)
        self.notebook.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Devices tab
        self.create_devices_tab()
        
        # Traffic tab
        self.create_traffic_tab()
        
        # Network info tab
        self.create_network_info_tab()
        
    def create_devices_tab(self):
        """Create the devices monitoring tab"""
        devices_frame = ttk.Frame(self.notebook)
        self.notebook.add(devices_frame, text="Connected Devices")
        
        # Devices treeview
        columns = ('IP', 'MAC', 'Hostname', 'Status', 'Packets', 'Data (KB)')
        self.devices_tree = ttk.Treeview(devices_frame, columns=columns, show='headings', height=15)
        
        # Configure columns
        for col in columns:
            self.devices_tree.heading(col, text=col)
            self.devices_tree.column(col, width=120, anchor='center')
        
        # Scrollbar for devices
        devices_scrollbar = ttk.Scrollbar(devices_frame, orient=tk.VERTICAL, command=self.devices_tree.yview)
        self.devices_tree.configure(yscrollcommand=devices_scrollbar.set)
        
        # Grid layout
        self.devices_tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        devices_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        devices_frame.columnconfigure(0, weight=1)
        devices_frame.rowconfigure(0, weight=1)
        
    def create_traffic_tab(self):
        """Create the traffic monitoring tab"""
        traffic_frame = ttk.Frame(self.notebook)
        self.notebook.add(traffic_frame, text="Traffic Log")
        
        # Traffic log text area
        self.traffic_text = scrolledtext.ScrolledText(traffic_frame, height=20, width=80)
        self.traffic_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Clear button
        ttk.Button(traffic_frame, text="Clear Log", 
                  command=self.clear_traffic_log).grid(row=1, column=0, pady=(5, 0))
        
        traffic_frame.columnconfigure(0, weight=1)
        traffic_frame.rowconfigure(0, weight=1)
        
    def create_network_info_tab(self):
        """Create the network information tab"""
        info_frame = ttk.Frame(self.notebook)
        self.notebook.add(info_frame, text="Network Info")
        
        # Network information text area
        self.info_text = scrolledtext.ScrolledText(info_frame, height=20, width=80)
        self.info_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Refresh button
        ttk.Button(info_frame, text="Refresh Info", 
                  command=self.refresh_network_info).grid(row=1, column=0, pady=(5, 0))
        
        info_frame.columnconfigure(0, weight=1)
        info_frame.rowconfigure(0, weight=1)
        
        # Initial network info
        self.refresh_network_info()
        
    def setup_network_interface(self):
        """Setup network interface selection"""
        self.refresh_interfaces()
        
    def refresh_interfaces(self):
        """Refresh available network interfaces"""
        try:
            interfaces = []
            for interface, addrs in psutil.net_if_addrs().items():
                # Filter for active interfaces (skip loopback, etc.)
                if interface != 'lo' and addrs:
                    interfaces.append(interface)
            
            self.interface_combo['values'] = interfaces
            if interfaces and not self.interface_var.get():
                self.interface_var.set(interfaces[0])
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get network interfaces: {e}")
    
    def toggle_monitoring(self):
        """Toggle network monitoring on/off"""
        if not self.is_monitoring:
            if not self.interface_var.get():
                messagebox.showwarning("Warning", "Please select a network interface")
                return
            
            self.start_monitoring()
        else:
            self.stop_monitoring()
    
    def start_monitoring(self):
        """Start network monitoring"""
        self.is_monitoring = True
        self.start_button.config(text="Stop Monitoring")
        self.status_label.config(text="Status: Monitoring", foreground="green")
        
        # Start monitoring thread
        self.monitor_thread = threading.Thread(target=self.monitor_network, daemon=True)
        self.monitor_thread.start()
        
        self.log_traffic("Network monitoring started")
    
    def stop_monitoring(self):
        """Stop network monitoring"""
        self.is_monitoring = False
        self.start_button.config(text="Start Monitoring")
        self.status_label.config(text="Status: Stopped", foreground="red")
        
        self.log_traffic("Network monitoring stopped")
    
    def monitor_network(self):
        """Main network monitoring loop"""
        packet_count = 0
        last_time = time.time()
        
        while self.is_monitoring:
            try:
                # Get network statistics
                net_stats = psutil.net_io_counters(pernic=True)
                interface = self.interface_var.get()
                
                if interface in net_stats:
                    stats = net_stats[interface]
                    
                    # Calculate bandwidth
                    current_time = time.time()
                    time_diff = current_time - last_time
                    
                    if time_diff > 0:
                        bytes_sent_diff = stats.bytes_sent - getattr(self, 'last_bytes_sent', stats.bytes_sent)
                        bytes_recv_diff = stats.bytes_recv - getattr(self, 'last_bytes_recv', stats.bytes_recv)
                        
                        bandwidth = (bytes_sent_diff + bytes_recv_diff) / time_diff / 1024  # KB/s
                        
                        self.last_bytes_sent = stats.bytes_sent
                        self.last_bytes_recv = stats.bytes_recv
                        last_time = current_time
                        
                        # Update bandwidth label
                        self.traffic_queue.put(('bandwidth', bandwidth))
                    
                    packet_count += stats.packets_sent + stats.packets_recv
                    self.traffic_queue.put(('packets', packet_count))
                
                # Discover devices on network
                self.discover_devices()
                
                time.sleep(1)  # Update every second
                
            except Exception as e:
                self.traffic_queue.put(('error', f"Monitoring error: {e}"))
                time.sleep(5)
    
    def discover_devices(self):
        """Discover devices on the network"""
        try:
            # Get network interface info
            interface = self.interface_var.get()
            addrs = psutil.net_if_addrs().get(interface, [])
            
            for addr in addrs:
                if addr.family == socket.AF_INET:
                    network_ip = addr.address
                    break
            else:
                return
            
            # Extract network prefix (assuming /24)
            network_prefix = '.'.join(network_ip.split('.')[:-1])
            
            # Scan network for devices
            devices_found = []
            
            # Use ARP table to find devices
            try:
                if os.name == 'nt':  # Windows
                    result = subprocess.run(['arp', '-a'], capture_output=True, text=True)
                    arp_output = result.stdout
                else:  # Linux/Mac
                    result = subprocess.run(['arp', '-a'], capture_output=True, text=True)
                    arp_output = result.stdout
                
                for line in arp_output.split('\n'):
                    if network_prefix in line:
                        parts = line.split()
                        if len(parts) >= 2:
                            ip = parts[0].strip('()')
                            mac = parts[1] if len(parts) > 1 else 'Unknown'
                            
                            # Get hostname
                            try:
                                hostname = socket.gethostbyaddr(ip)[0]
                            except:
                                hostname = 'Unknown'
                            
                            devices_found.append({
                                'ip': ip,
                                'mac': mac,
                                'hostname': hostname,
                                'status': 'Active'
                            })
                            
            except Exception as e:
                self.traffic_queue.put(('error', f"ARP scan error: {e}"))
            
            # Update devices
            self.traffic_queue.put(('devices', devices_found))
            
        except Exception as e:
            self.traffic_queue.put(('error', f"Device discovery error: {e}"))
    
    def update_gui(self):
        """Update GUI elements"""
        try:
            # Process queued updates
            while not self.traffic_queue.empty():
                try:
                    update_type, data = self.traffic_queue.get_nowait()
                    
                    if update_type == 'bandwidth':
                        self.bandwidth_label.config(text=f"Bandwidth: {data:.1f} KB/s")
                    elif update_type == 'packets':
                        self.packet_count_label.config(text=f"Packets: {data}")
                    elif update_type == 'devices':
                        self.update_devices_display(data)
                    elif update_type == 'error':
                        self.log_traffic(f"ERROR: {data}")
                        
                except queue.Empty:
                    break
                    
        except Exception as e:
            print(f"GUI update error: {e}")
        
        # Schedule next update
        self.root.after(1000, self.update_gui)
    
    def update_devices_display(self, devices):
        """Update the devices treeview"""
        # Clear existing items
        for item in self.devices_tree.get_children():
            self.devices_tree.delete(item)
        
        # Add new devices
        for device in devices:
            self.devices_tree.insert('', 'end', values=(
                device['ip'],
                device['mac'],
                device['hostname'],
                device['status'],
                '0',  # Packets
                '0'   # Data
            ))
        
        # Update device count
        self.device_count_label.config(text=f"Devices: {len(devices)}")
    
    def log_traffic(self, message):
        """Log traffic message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}\n"
        
        self.traffic_text.insert(tk.END, log_message)
        self.traffic_text.see(tk.END)
    
    def clear_traffic_log(self):
        """Clear the traffic log"""
        self.traffic_text.delete(1.0, tk.END)
    
    def refresh_network_info(self):
        """Refresh network information"""
        try:
            info = "=== Network Information ===\n\n"
            
            # Network interfaces
            info += "Network Interfaces:\n"
            for interface, addrs in psutil.net_if_addrs().items():
                info += f"  {interface}:\n"
                for addr in addrs:
                    info += f"    {addr.family.name}: {addr.address}\n"
                info += "\n"
            
            # Network statistics
            info += "Network Statistics:\n"
            net_stats = psutil.net_io_counters()
            info += f"  Bytes sent: {net_stats.bytes_sent:,}\n"
            info += f"  Bytes received: {net_stats.bytes_recv:,}\n"
            info += f"  Packets sent: {net_stats.packets_sent:,}\n"
            info += f"  Packets received: {net_stats.packets_recv:,}\n"
            info += f"  Errors in: {net_stats.errin:,}\n"
            info += f"  Errors out: {net_stats.errout:,}\n"
            info += f"  Drops in: {net_stats.dropin:,}\n"
            info += f"  Drops out: {net_stats.dropout:,}\n\n"
            
            # System information
            info += "System Information:\n"
            info += f"  Hostname: {socket.gethostname()}\n"
            info += f"  Platform: {sys.platform}\n"
            info += f"  Python version: {sys.version}\n"
            
            self.info_text.delete(1.0, tk.END)
            self.info_text.insert(1.0, info)
            
        except Exception as e:
            self.info_text.delete(1.0, tk.END)
            self.info_text.insert(1.0, f"Error getting network info: {e}")

def main():
    """Main function"""
    root = tk.Tk()
    app = NetworkMonitor(root)
    
    # Handle window closing
    def on_closing():
        if app.is_monitoring:
            app.stop_monitoring()
        root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()
