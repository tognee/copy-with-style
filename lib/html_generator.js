'use babel';

import Editor from './atom_editor';

import { Color, rgba2rgb } from './color';
import { getTextNodesIn } from './node_manipulation';


export default class HTMLgenerator {
  constructor( config, callback ){
    this.config = config;
    this.callback = callback;
    this.background_color = new Color( this.config.background_color );
    this.og_themes = atom.config.get('core.themes')
    atom.config.set('core.themes', [this.og_themes[0], this.config.theme])
    this.ln_color = new Color( this.config.ln_color );
    this.line_number = this.config.ln_enable;
    this.ln_count = this.config.ln_count > -1
    this.ln_span = '<span style="color:'+ this.ln_color.hex()+ ';">';
    this.ln_id = 1;
    this.html = '<pre style="background-color:'+ this.background_color.hex() +';'+'"><code style="'+ this.create_code_block_style() +'">';
    this.indent = undefined
  }

  style_node( node ){
    let style, color, css;

    if( !node.data ){ return; }

    style = window.getComputedStyle( node.parentElement );
    color = new Color( style.color ).rgba2rgb( this.background_color );
    css = 'color:' + color.rgb() + ';';
    if( style.fontWeight === 'bold' ){ css += 'font-weight:blod;'; }
    if( style.textDecoration === 'underline' ){ css += 'text-decoration:underline;'; }
    if( style.fontStyle === 'italic' ){ css += 'font-style:italic;'; }
    let data = node.data
    if (node.parentElement.classList.contains("leading-whitespace"))
        data = "&nbsp;&nbsp;"
    return '<span style="'+css+'">'+data+'</span>';
  }

  create_code_block_style(){
    var font_family, font_size, css;

    font_family = this.config.font_family;
    font_size = this.config.font_size;

    css =  'background-color:'+ this.background_color.hex() +';';
    css += 'font-family:\''+ font_family +'\';';
    css += 'font-size:'+ font_size +'pt;';

    return css;
  }

  generate_line( line, id, pos ){
    let html = '<span style="display:inline-block;" class="line">'
    if (this.line_number) {
      let value, ln;
      if (this.ln_count) {
        value = this.ln_id++;
      } else {
        value = pos.row + 1;
      }
      if (pos.column) {
        ln = "   | "
      } else {
        ln = ("    " + (value)).slice(-4) + " "
      }
      html += this.ln_span + ln + "</span>"
    }
    let leadingWhitespaces = line.querySelectorAll(".leading-whitespace").length
    if (this.indent === undefined || (
      line.textContent.trim() != "" && this.indent > leadingWhitespaces
    ))
      this.indent = leadingWhitespaces
    html += getTextNodesIn(line).map( this.style_node.bind( this )).join('');
    html += '</span>\n';
    // console.log("> HTML(#" + id + " -> buf: " + pos + ")");
    this.html += (html)
  }

  finalize(){
    let indent_nodes = `<span style="[^"]*">&nbsp;&nbsp;</span>`.repeat(this.indent)
    this.html = this.html.trim() + '</code></pre>';
    if (indent_nodes != "" && this.config.remove_indent){
      let regexp = new RegExp(indent_nodes)
      let split_html = this.html.split("\n")
      split_html.forEach((line, i) => {
        split_html[i] = line.replace(regexp, "")
      })
      this.html = split_html.join("\n")
    }
    this.callback( this.html, 'html' );
    atom.config.set('core.themes', this.og_themes)
  }

  generate(){
    new Editor( this.finalize.bind( this )).process_lines( this.generate_line.bind( this ));
  }
}
