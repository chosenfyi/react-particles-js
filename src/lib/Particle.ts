import {hexToRgb, IParams, ParticlesLibrary, getColor} from '.';

export default class Particle{

  params: IParams;
  library: ParticlesLibrary;

  radius: number;
  radius_bubble: number;
  size_status: boolean;
  vs: number;

  x: number;
  y: number;

  lifetime: number;
  color: any;

  opacity: number;
  opacity_bubble: number;
  opacity_status: boolean;
  vo: number;

  vx: number;
  vy: number;

  vx_i: number;
  vy_i: number;

  shape: string;

  img: { src: string; ratio: number; loaded?: boolean; obj?: any; };

  constructor( params: IParams, library: ParticlesLibrary, color?: any, opacity?: any, position?: { x: number; y: number; }){
    this.params = params;
    this.lifetime = params.particles.lifetime;
    this.library = library;
    this.setupSize();
    this.setupPosition( position );
    this.setupColor( color );
    this.setupOpacity();
    this.setupAnimation();
  }

  setupSize(): void{
    this.radius = ( this.params.particles.size.random ? Math.random() : 1 ) * this.params.particles.size.value;
    if( this.params.particles.size.anim.enable ){
      this.size_status = false;
      this.vs = this.params.particles.size.anim.speed / 100;
      if( !this.params.particles.size.anim.sync )
        this.vs = this.vs * Math.random();
    }
  }

  setupPosition( position?: { x: number; y: number; }): void{

    let {canvas, vendors} = this.library;

    this.x = position ? position.x : Math.random() * canvas.width;
    this.y = position ? position.y : Math.random() * canvas.height;

    if( this.x > canvas.width - this.radius * 2 ){
      this.x = this.x - this.radius;
    }else if( this.x < this.radius * 2 ){
      this.x = this.x + this.radius;
    }
    if( this.y > canvas.height - this.radius * 2 ){
      this. y = this.y - this.radius;
    }else if( this.y < this.radius * 2 ){
      this.y = this.y + this.radius;
    }

    if( this.params.particles.move.bounce ){
      vendors.checkOverlap( this, position );
    }
  }

  setupColor( color?: any ){
    this.color = getColor( color.value );
  }

  setupOpacity(): void{
    this.opacity = ( this.params.particles.opacity.random ? Math.random() : 1 ) * this.params.particles.opacity.value;
    if( this.params.particles.opacity.anim.enable ){
      this.opacity_status = false;
      this.vo = this.params.particles.opacity.anim.speed / 100;
      if( !this.params.particles.opacity.anim.sync ){
        this.vo = this.vo * Math.random();
      }
    }
  }

  setupAnimation(): void{

    let {tmp, vendors} = this.library;

    let velbase: { x: number; y: number; } = null;
    switch( this.params.particles.move.direction ){
      case 'top':
        velbase = { x: 0, y: -1 };
        break;
      case 'top-right':
        velbase = { x: 0.5, y: -0.5 };
        break;
      case 'right':
        velbase = { x: 1, y: 0 };
        break;
      case 'bottom-right':
        velbase = { x: 0.5, y: 0.5 };
        break;
      case 'bottom':
        velbase = { x: 0, y: 1 };
        break;
      case 'bottom-left':
        velbase = { x: -0.5, y: 1 };
        break;
      case 'left':
        velbase = { x: -1, y:0 };
        break;
      case 'top-left':
        velbase = { x: -0.5, y: -0.5 };
        break;
      default:
        velbase = { x: 0, y: 0 };
        break;
    }
    if( this.params.particles.move.straight ){
      this.vx = velbase.x;
      this.vy = velbase.y;
      if( this.params.particles.move.random ) {
        const lag = this.getLag()
        this.vx = this.vx * ( Math.random() ) * lag;
        this.vy = this.vy * ( Math.random() ) * lag;
      }
    }else{
      this.vx = velbase.x + Math.random() - 0.5;
      this.vy = velbase.y + Math.random() - 0.5;
    }

    this.vx_i = this.vx;
    this.vy_i = this.vy;

    let shape_type: any = this.params.particles.shape.type;

    if( typeof( shape_type ) == 'object' ){
      if( shape_type instanceof Array ){
        let shape_selected: string = shape_type[ Math.floor( Math.random() * shape_type.length ) ];
        this.shape = shape_selected;
      }
    }else{
      this.shape = shape_type;
    }

    if( this.shape == 'image' ){
      let sh: any = this.params.particles.shape;
      this.img = {
        src: sh.image.src,
        ratio: sh.image.width / sh.image.height
      };
      if( !this.img.ratio )
        this.img.ratio = 1;
      if( tmp.img_type == 'svg' && tmp.source_svg != undefined ){
        vendors.createSvgImg( this );
        if( tmp.pushing ){
          this.img.loaded = false;
        }
      }
    }
  }

  public getLag(): number {
      return this.lifetime / this.params.particles.lifetime
  }

  public draw(): void{

    let {canvas, tmp, vendors} = this.library;
    let {particles} = this.params;

    let radius: number;
    if( this.radius_bubble != undefined ){
      radius = this.radius_bubble;
    }else{
      radius = this.radius;
    }

    let opacity: number;
    if( this.opacity_bubble != undefined ){
      opacity = this.opacity_bubble;
    }else{
      opacity = this.opacity;
    }

    opacity *= this.getLag()

    let color_value: string;
    if( this.color.rgb ){
      let {r, g, b} = this.color.rgb;
      color_value = `rgba( ${r}, ${g}, ${b}, ${opacity} )`;
    }else{
      let {h, s, l} = this.color.hsl;
      color_value = `hsla( ${h}, ${s}, ${l}, ${opacity} )`;
    }

    canvas.ctx.fillStyle = color_value;
    canvas.ctx.beginPath();

    switch( this.shape ){
      case 'circle':
        canvas.ctx.arc( this.x, this.y, radius, 0, Math.PI * 2, false );
        break;

      case 'edge':
        canvas.ctx.rect( this.x - radius, this.y - radius, radius * 2, radius * 2 );
        break;

      case 'triangle':
        vendors.drawShape( canvas.ctx, this.x - radius, this.y + radius / 1.66, radius * 2, 3, 2 );
        break;

      case 'polygon':
        vendors.drawShape(
          canvas.ctx,
          this.x - radius / ( this.params.particles.shape.polygon.nb_sides / 3.5 ),
          this.y - radius / ( 2.66 / 3.5 ),
          radius * 2.66 / ( this.params.particles.shape.polygon.nb_sides / 3 ),
          this.params.particles.shape.polygon.nb_sides,
          1
        );
        break;

      case 'star':
        vendors.drawShape(
          canvas.ctx,
          this.x - radius * 2 / ( this.params.particles.shape.polygon.nb_sides / 4 ),
          this.y - radius / ( 2 * 2.66 / 3.5 ),
          radius * 2 * 2.66 / ( this.params.particles.shape.polygon.nb_sides / 3 ),
          this.params.particles.shape.polygon.nb_sides,
          2
        );
        break;

      case 'image':
        let draw: ( img_obj: any ) => void = 
          ( img_obj ) => {
            canvas.ctx.drawImage(
              img_obj,
              this.x - radius,
              this.y - radius,
              radius * 2,
              radius * 2 / this.img.ratio
            );
          };
        let img_obj: any;
        if( tmp.img_type == 'svg' ){
          img_obj = this.img.obj;
        }else{
          img_obj = tmp.img_obj;
        }
        if( img_obj )
          draw( img_obj );
        break;
    }

    canvas.ctx.closePath();

    if( this.params.particles.shape.stroke.width > 0 ){
      canvas.ctx.strokeStyle = this.params.particles.shape.stroke.color;
      canvas.ctx.lineWidth = this.params.particles.shape.stroke.width;
      canvas.ctx.stroke();
    }

    canvas.ctx.fill();
  }

}
