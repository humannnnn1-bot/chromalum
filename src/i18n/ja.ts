import type { Translations } from "./types";

export const ja = {
  // Tools
  tool_brush: "✏️ブラシ",
  tool_eraser: "🧹消しゴム",
  tool_fill: "🪣塗りつぶし",
  tool_line: "📏直線",
  tool_rect: "▭矩形",
  tool_ellipse: "◯楕円",

  // Tool announce (keyboard shortcut feedback)
  announce_brush: "ブラシ",
  announce_eraser: "消しゴム",
  announce_fill: "塗りつぶし",
  announce_line: "直線",
  announce_rect: "矩形",
  announce_ellipse: "楕円",
  announce_level: "レベル{0} {1}",
  announce_size: "サイズ {0}",

  // SourcePanel
  label_source: "SOURCE",
  aria_drawing_canvas: "描画キャンバス（グレースケール）",
  aria_drawing_tools: "描画ツール",
  btn_undo: "↩戻す(Z)",
  btn_redo: "↪やり直し(Y)",
  title_undo: "元に戻す (Ctrl+Z)",
  title_redo: "やり直し (Ctrl+Y)",
  title_zoom_reset: "ズームリセット",
  aria_zoom_reset: "ズームリセット (現在 {0}%)",
  label_size: "サイズ",
  aria_brush_size: "ブラシサイズ",
  aria_brush_size_decrease: "ブラシサイズ縮小",
  aria_brush_size_increase: "ブラシサイズ拡大",
  btn_new: "📐新規",
  title_new_canvas: "新規キャンバス作成",
  btn_load: "📂読込",
  aria_open_image: "画像ファイルを開く",
  btn_clear: "🗑クリア",
  title_clear: "キャンバスをクリア",
  btn_save_color: "💾カラー",
  btn_save_gray: "💾グレー",
  btn_save_svg: "💾SVG",
  btn_copy: "📋コピー",
  title_copy: "カラー画像をクリップボードにコピー",
  label_png_scale: "PNGスケール",
  aria_png_scale: "PNG {0}倍スケール",
  btn_palette_export: "📥パレット保存",
  title_palette_export: "パレットをJSONで保存",
  btn_palette_import: "📤パレット読込",
  title_palette_import: "パレットをJSONから読込",
  aria_palette_file: "パレットファイルを読み込む",
  announce_level_btn: "レベル{0} {1}",

  // ColorPanel
  label_colorized: "COLORIZED",
  label_color_mapping: "COLOR MAPPING",
  aria_color_preview: "カラープレビュー（キーボード: +/-でズーム、矢印キーでパン）",
  aria_color_preview_canvas: "カラープレビューキャンバス",

  // ColorMappingList
  aria_prev_color: "前の色候補 (Level {0} {1})",
  aria_next_color: "次の色候補 (Level {0} {1})",
  aria_color_candidate: "Level {0} 色候補 {1} {2}",

  // HexDiag
  hex_diagram_label: "色相環の六角形ダイアグラム",
  hex_luminance_seq: "一周の輝度列: 2,3,4,5,6,5,4,5,4,3,2,1,2,3",
  hex_title: "色相環の六角形 — 輝度レベル配置図",

  // NewCanvasModal
  new_canvas_title: "新規キャンバス",
  new_canvas_max: "最大",
  btn_create: "作成",
  btn_cancel: "キャンセル",

  // ErrorBoundary
  error_occurred: "エラーが発生しました",
  btn_retry: "再試行",

  // HelpModal
  help_title: "ショートカット一覧",
  help_brush: "ブラシ",
  help_eraser: "消しゴム",
  help_fill: "塗りつぶし",
  help_line: "直線",
  help_rect: "矩形",
  help_ellipse: "楕円",
  help_level: "輝度レベル選択",
  help_brush_size: "ブラシサイズ増減",
  help_pan: "パン",
  help_zoom: "ズーム",
  help_new_canvas: "新規キャンバス",
  help_undo: "元に戻す",
  help_redo: "やり直し",
  help_paste: "画像ペースト",
  help_this_help: "このヘルプ",
  help_close: "閉じる",
  help_pan_key: "Space+ドラッグ",
  help_zoom_key: "ホイール",

  // App - toast messages
  toast_restore_failed: "保存データの復元に失敗しました",
  toast_autosave_failed: "自動保存に失敗しました",
  toast_image_gen_failed: "画像の生成に失敗しました（メモリ不足の可能性）",
  toast_memory_warning: "{0}×{1}px — メモリ負荷が高い可能性があります",
  toast_clipboard_unsupported: "ClipboardItem未対応",
  toast_copied: "コピーしました",
  toast_copy_failed: "コピー失敗",
  toast_svg_size_warning: "SVG {0}×{1} — サイズが非常に大きくなる可能性があります",
  toast_svg_gen_failed: "SVG生成に失敗しました（メモリ不足の可能性）",
  toast_palette_saved: "パレットを保存しました",
  toast_palette_format_invalid: "パレットファイルの形式が不正です",
  toast_palette_loaded: "パレットを読み込みました",
  toast_palette_load_failed: "パレットの読み込みに失敗しました",
  toast_cleared: "クリアしました (Ctrl+Zで元に戻せます)",
  toast_new_canvas_created: "{0}×{1} の新規キャンバスを作成しました",

  // FileDrop
  toast_image_load_failed: "画像の読み込みに失敗しました",
  toast_image_process_failed: "画像処理に失敗しました",
  toast_image_resized: "{0}×{1} → {2}×{3} にリサイズ",
  drop_image: "画像をドロップ",
  drop_announce: "画像をドロップしてください",

  // Header
  help_link: "ヘルプ",

  // Language switcher
  lang_switch: "EN",
} as const satisfies Translations;
