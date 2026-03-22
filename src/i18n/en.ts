import type { Translations } from "./types";

export const en = {
  // Tools
  tool_brush: "✏️Brush",
  tool_eraser: "🧹Eraser",
  tool_fill: "🪣Fill",
  tool_line: "📏Line",
  tool_rect: "▭Rect",
  tool_ellipse: "◯Ellipse",

  // Tool announce (keyboard shortcut feedback)
  announce_brush: "Brush",
  announce_eraser: "Eraser",
  announce_fill: "Fill",
  announce_line: "Line",
  announce_rect: "Rect",
  announce_ellipse: "Ellipse",
  announce_level: "Level {0} {1}",
  announce_size: "Size {0}",

  // SourcePanel
  label_source: "SOURCE",
  aria_drawing_canvas: "Drawing canvas (grayscale)",
  aria_drawing_tools: "Drawing tools",
  btn_undo: "↩Undo(Z)",
  btn_redo: "↪Redo(Y)",
  title_undo: "Undo (Ctrl+Z)",
  title_redo: "Redo (Ctrl+Y)",
  title_zoom_reset: "Reset zoom",
  aria_zoom_reset: "Reset zoom (current {0}%)",
  label_size: "Size",
  aria_brush_size: "Brush size",
  aria_brush_size_decrease: "Decrease brush size",
  aria_brush_size_increase: "Increase brush size",
  btn_new: "📐New",
  title_new_canvas: "Create new canvas",
  btn_load: "📂Load",
  aria_open_image: "Open image file",
  btn_clear: "🗑Clear",
  title_clear: "Clear canvas",
  btn_save_color: "💾Color",
  btn_save_gray: "💾Gray",
  btn_save_svg: "💾SVG",
  btn_copy: "📋Copy",
  title_copy: "Copy color image to clipboard",
  label_png_scale: "PNG Scale",
  aria_png_scale: "PNG {0}x scale",
  btn_palette_export: "📥Save Palette",
  title_palette_export: "Save palette as JSON",
  btn_palette_import: "📤Load Palette",
  title_palette_import: "Load palette from JSON",
  aria_palette_file: "Load palette file",
  announce_level_btn: "Level {0} {1}",

  // ColorPanel
  label_colorized: "COLORIZED",
  label_color_mapping: "COLOR MAPPING",
  aria_color_preview: "Color preview (keyboard: +/- to zoom, arrow keys to pan)",
  aria_color_preview_canvas: "Color preview canvas",

  // ColorMappingList
  aria_prev_color: "Previous color candidate (Level {0} {1})",
  aria_next_color: "Next color candidate (Level {0} {1})",
  aria_color_candidate: "Level {0} color candidate {1} {2}",

  // HexDiag
  hex_diagram_label: "Hexagonal hue ring diagram",
  hex_luminance_seq: "Luminance cycle: 2,3,4,5,6,5,4,5,4,3,2,1,2,3",
  hex_title: "Hexagonal hue ring — Luminance level layout",

  // NewCanvasModal
  new_canvas_title: "New Canvas",
  new_canvas_max: "Max",
  btn_create: "Create",
  btn_cancel: "Cancel",

  // ErrorBoundary
  error_occurred: "An error occurred",
  btn_retry: "Retry",

  // HelpModal
  help_title: "Keyboard Shortcuts",
  help_brush: "Brush",
  help_eraser: "Eraser",
  help_fill: "Fill",
  help_line: "Line",
  help_rect: "Rect",
  help_ellipse: "Ellipse",
  help_level: "Select luminance level",
  help_brush_size: "Brush size +/-",
  help_pan: "Pan",
  help_zoom: "Zoom",
  help_new_canvas: "New canvas",
  help_undo: "Undo",
  help_redo: "Redo",
  help_paste: "Paste image",
  help_this_help: "This help",
  help_close: "Close",
  help_pan_key: "Space+Drag",
  help_zoom_key: "Wheel",

  // App - toast messages
  toast_restore_failed: "Failed to restore saved data",
  toast_autosave_failed: "Auto-save failed",
  toast_image_gen_failed: "Failed to generate image (possibly out of memory)",
  toast_memory_warning: "{0}×{1}px — May cause high memory usage",
  toast_clipboard_unsupported: "ClipboardItem not supported",
  toast_copied: "Copied",
  toast_copy_failed: "Copy failed",
  toast_svg_size_warning: "SVG {0}×{1} — File may be very large",
  toast_svg_gen_failed: "SVG generation failed (possibly out of memory)",
  toast_palette_saved: "Palette saved",
  toast_palette_format_invalid: "Invalid palette file format",
  toast_palette_loaded: "Palette loaded",
  toast_palette_load_failed: "Failed to load palette",
  toast_cleared: "Cleared (Ctrl+Z to undo)",
  toast_new_canvas_created: "Created new {0}×{1} canvas",

  // FileDrop
  toast_image_load_failed: "Failed to load image",
  toast_image_process_failed: "Image processing failed",
  toast_image_resized: "Resized: {0}×{1} → {2}×{3}",
  drop_image: "Drop image",
  drop_announce: "Drop an image here",

  // Header
  help_link: "Help",

  // Language switcher
  lang_switch: "JA",
} as const satisfies Translations;
