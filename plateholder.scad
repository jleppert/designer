$fn = 30;

inchToMetric = 25.4;

// 1/4"x20 13/64 drill bit tap
tap_size = (13/64) * inchToMetric;

module plate_holder(plate_width, plate_height, plate_thickness, inset_border_width, apeture_border_width, border_width) {
    
    union() {
        difference() {
            holder_thickness = (plate_thickness + (inset_border_width * 2)) * 2;
            cube([plate_width + (border_width), plate_height + (border_width), holder_thickness]);
            translate([apeture_border_width * 2, apeture_border_width * 2, 0]) {
                cube([plate_width - apeture_border_width, plate_height - apeture_border_width, (plate_thickness + (inset_border_width * 2)) * 2]);
            }
            
            inset_width = plate_width + (inset_border_width * 2);
            inset_height = plate_height + (inset_border_width * 2);
            translate([border_width / 2, border_width / 2, holder_thickness / 4]) {
                cube([inset_width, inset_height, plate_thickness + (inset_border_width * 2)]);
            }
        }
        translate([0 - border_width, 0, 0]) {
            difference()  {
                table_mount = 15;
                
                cube([table_mount, plate_height + border_width, table_mount]);
                
                hole_count = floor((plate_height + border_width - tap_size) / inchToMetric);
                center = (plate_height + border_width) / 2;
                start = 0;
                start = center - floor(hole_count / 2) * inchToMetric - .5*inchToMetric* ((((hole_count - 1) % 2) + 1) % 2);

                for(current_hole = [0: 1: hole_count]) {
                    translate([table_mount/2, start + current_hole * inchToMetric, 0])  {
                        
                        union() {
                            cylinder(h = table_mount, d = tap_size);
                        
                            translate([0 - table_mount, 0, (table_mount/2)]) {
                                rotate([0, 90, 0]) {
                                    cylinder(h = table_mount * 2, d = tap_size);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

plate_holder(102, 147, 2.4, 0.25, 3, 10);