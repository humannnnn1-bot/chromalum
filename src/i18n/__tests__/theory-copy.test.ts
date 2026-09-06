import { describe, expect, it } from "vitest";
import { en } from "../en";
import { ja } from "../ja";

describe("Theory copy", () => {
  it("states the exact structures carried by the same eight-state set", () => {
    expect(en.theory_intro).toContain("A=𝒫(E)");
    expect(en.theory_intro).toContain("S∨T=S∪T");
    expect(en.theory_intro).toContain("S⊕T=S△T");
    expect(en.theory_intro).toContain("reduct (A,⊕)");
    expect(en.theory_intro).toContain("(𝔽₂³,+)");
    expect(en.theory_intro).toContain("(A,⊕,∧)≅𝔽₂×𝔽₂×𝔽₂");
    expect(en.theory_intro).toContain("not the field GF(8)");
    expect(en.theory_intro).toContain("G∧R=K");

    expect(ja.theory_intro).toContain("A=𝒫(E)");
    expect(ja.theory_intro).toContain("S∨T=S∪T");
    expect(ja.theory_intro).toContain("S⊕T=S△T");
    expect(ja.theory_intro).toContain("reduct (A,⊕)");
    expect(ja.theory_intro).toContain("(𝔽₂³,+)");
    expect(ja.theory_intro).toContain("(A,⊕,∧) はブール環 𝔽₂×𝔽₂×𝔽₂");
    expect(ja.theory_intro).toContain("体 GF(8) ではありません");
    expect(ja.theory_intro).toContain("G∧R=K");
  });

  it("keeps mathematical weights and conditional color rank distinct in the combined panel", () => {
    expect(en.theory_subset_intro).toContain("positive integer weights");
    expect(en.theory_subset_rule).toContain("current maximum plus 1");
    expect(en.theory_empirical_desc).toContain("Color order alone supplies the named rank");
    expect(en.theory_empirical_order_intro).toContain("assume G exceeds M and R exceeds B");
    expect(en.theory_empirical_rank_note).toContain("does not assign the measured scores");
    expect(en.theory_derivation_convergence_note).toContain("unnamed weights {1,2,4}");
    expect(en.theory_derivation_convergence_note).toContain("named ranks B=1, R=2, G=4");
    expect(ja.theory_subset_intro).toContain("正整数重み");
    expect(ja.theory_subset_rule).toContain("既存の最大値＋1");
    expect(ja.theory_empirical_desc).toContain("それ自体で名前付き順位");
    expect(ja.theory_empirical_order_intro).toContain("仮定します");
    expect(ja.theory_empirical_rank_note).toContain("測定スコアそのものを1・2・4とする主張ではありません");
    expect(ja.theory_derivation_convergence_note).toContain("無名の{1,2,4}");
    expect(ja.theory_derivation_convergence_note).toContain("B=1、R=2、G=4という名前付き順位");
  });

  it("makes valuation, XOR correction, and complement mainline consequences", () => {
    expect(en.theory_valuation_desc).toContain("L(a∨b)+L(a∧b)=L(a)+L(b)");
    expect(en.theory_valuation_desc).toContain("L(a⊕b)=L(a)+L(b)−2L(a∧b)");
    expect(en.theory_valuation_desc).toContain("L(b)−L(a)=Σ_{c∈b∖a}w_c>0");
    expect(en.theory_valuation_desc).toContain("linear extension of Boolean inclusion");
    expect(en.theory_valuation_desc).toContain("Ω=Σ_{c∈E}w_c=7");
    expect(en.theory_valuation_desc).toContain("L(¬a)=Ω−L(a)=7−L(a)");
    expect(en.theory_valuation_xor_note).toContain("doubled intersection");
    expect(en.theory_valuation_xor_note).toContain("not a homomorphism");
    expect(en.theory_valuation_complement_note).toContain("K/W, B/Y, R/C, and M/G");

    expect(ja.theory_valuation_desc).toContain("L(a∨b)+L(a∧b)=L(a)+L(b)");
    expect(ja.theory_valuation_desc).toContain("L(a⊕b)=L(a)+L(b)−2L(a∧b)");
    expect(ja.theory_valuation_desc).toContain("L(b)−L(a)=Σ_{c∈b∖a}w_c>0");
    expect(ja.theory_valuation_desc).toContain("linear extension");
    expect(ja.theory_valuation_desc).toContain("Ω=Σ_{c∈E}w_c=7");
    expect(ja.theory_valuation_desc).toContain("L(¬a)=Ω−L(a)=7−L(a)");
    expect(ja.theory_valuation_xor_note).toContain("共通部分の二倍");
    expect(ja.theory_valuation_xor_note).toContain("群準同型ではありません");
    expect(ja.theory_valuation_complement_note).toContain("K/W、B/Y、R/C、M/G");
  });

  it("states the exact Fano-Hamming incidence correspondence", () => {
    expect(en.theory_structures_desc).toContain("not merely a shared count of seven");
    expect(en.theory_hamming_bridge).toContain("Hxᵀ=h_i⊕h_j⊕h_k");
    expect(en.theory_hamming_bridge).toContain("rank H=3");
    expect(en.theory_hamming_bridge).toContain("dim ker H=7−3=4");
    expect(en.theory_hamming_bridge).toContain("minimum distance d_min=3");
    expect(en.theory_hamming_title).toBe("Hamming [7,4,3] Code");
    expect(en.theory_hamming_desc).toContain("adds three parity bits to four data bits, producing a seven-bit codeword");
    expect(en.theory_hamming_desc).toContain("length 7, dimension 4, and minimum Hamming distance 3");
    expect(en.theory_hamming_desc).toContain("syndrome 000");
    expect(en.theory_hamming_desc).toContain("single-error positions");

    expect(ja.theory_structures_desc).toContain("七という個数の一致ではなく");
    expect(ja.theory_hamming_bridge).toContain("Hxᵀ=h_i⊕h_j⊕h_k");
    expect(ja.theory_hamming_bridge).toContain("rank H=3");
    expect(ja.theory_hamming_bridge).toContain("dim ker H=7−3=4");
    expect(ja.theory_hamming_bridge).toContain("最小距離d_min=3");
    expect(ja.theory_hamming_title).toBe("Hamming [7,4,3] 符号");
    expect(ja.theory_hamming_desc).toContain("4ビットのデータに3つのパリティビットを加え、7ビットの符号語へ変換");
    expect(ja.theory_hamming_desc).toContain("符号長、4は次元、3は符号語間の最小Hamming距離");
    expect(ja.theory_hamming_desc).toContain("syndromeは000");
    expect(ja.theory_hamming_desc).toContain("単一誤り位置");
  });

  it("keeps the conditional operation identities in the dedicated mixing explanation", () => {
    for (const copy of [en, ja]) {
      const text = copy.theory_mixing_operations_desc;
      for (const formula of ["[G,R,B]", "a∧b=000", "a∨b=a⊕b", "a∨b=111", "a∧b=XNOR(a,b)", "XNOR(a,b)=¬(a⊕b)"]) {
        expect(text).toContain(formula);
      }
    }
  });

  it("distinguishes the chosen cube model from the hue-order and complement correspondences", () => {
    expect(en.theory_dice_net_desc).toContain("cube is a chosen model");
    expect(en.theory_dice_net_desc).toContain("preserving the five connections");
    expect(en.theory_dice_net_desc).toContain("without overlapping squares");
    expect(ja.theory_dice_net_desc).toContain("選んだモデル");
    expect(ja.theory_dice_net_desc).toContain("五つの接続を保って");
    expect(ja.theory_dice_net_desc).toContain("正方形を重ねずに");
    for (const copy of [en, ja]) {
      expect(copy.theory_dice_net_desc).toContain("R→Y→G→C→B→M");
      expect(copy.theory_dice_net_desc).not.toContain("ΔL");
      for (const formula of ["L(κ(c))=7−L(c)", "(R₂,C₅)", "(Y₆,B₁)", "(G₄,M₃)"]) {
        expect(copy.theory_dice_desc2).toContain(formula);
      }
    }
    expect(en.theory_dice_desc2).toContain("standard die numbering");
    expect(ja.theory_dice_desc2).toContain("標準ダイス番号");
  });

  it("states the Tone Zigzag as the affine extension of the chromatic six-cycle", () => {
    expect(en.theory_zigzag_desc).toContain("ι:A→{0,1}³⊂ℝ³");
    expect(en.theory_zigzag_desc).toContain("γᵢ(u)=(1−u)ι(cᵢ)+uι(cᵢ₊₁)");
    expect(en.theory_zigzag_desc).toContain("λ(γᵢ(u))=(1−u)L(cᵢ)+uL(cᵢ₊₁)");
    expect(en.theory_zigzag_desc).toContain("κ̄(x)=1−x");
    expect(en.theory_zigzag_desc).toContain("T(h+1/2)=1−T(h)");
    expect(en.theory_zigzag_desc).toContain("1,3,3,3,3,1");
    expect(en.theory_zigzag_desc).toContain("23456545432123");
    expect(en.theory_zigzag_desc).toContain("four preimages");
    expect(en.theory_zigzag_desc).toContain("|ΔLᵢ|=|L(cᵢ₊₁)−L(cᵢ)|=L(cᵢ⊕cᵢ₊₁)∈{4,2,1}");
    expect(en.theory_zigzag_desc).toContain("(4,2,1,4,2,1)");
    expect(en.theory_zigzag_desc).toContain("The sign gives the direction of inclusion");
    expect(en.theory_zigzag_desc).toContain("absolute-value sequence");

    expect(ja.theory_zigzag_desc).toContain("ι:A→{0,1}³⊂ℝ³");
    expect(ja.theory_zigzag_desc).toContain("γᵢ(u)=(1−u)ι(cᵢ)+uι(cᵢ₊₁)");
    expect(ja.theory_zigzag_desc).toContain("λ(γᵢ(u))=(1−u)L(cᵢ)+uL(cᵢ₊₁)");
    expect(ja.theory_zigzag_desc).toContain("κ̄(x)=1−x");
    expect(ja.theory_zigzag_desc).toContain("T(h+1/2)=1−T(h)");
    expect(ja.theory_zigzag_desc).toContain("1,3,3,3,3,1");
    expect(ja.theory_zigzag_desc).toContain("23456545432123");
    expect(ja.theory_zigzag_desc).toContain("交点数が4");
    expect(ja.theory_zigzag_desc).toContain("|ΔLᵢ|=|L(cᵢ₊₁)−L(cᵢ)|=L(cᵢ⊕cᵢ₊₁)∈{4,2,1}");
    expect(ja.theory_zigzag_desc).toContain("(4,2,1,4,2,1)");
    expect(ja.theory_zigzag_desc).toContain("符号は包含の向き");
    expect(ja.theory_zigzag_desc).toContain("絶対値列");
  });

  it("states the subgroup, coset, and dual-octahedron structures exactly", () => {
    expect(en.theory_stella_desc).toContain("T0=ker π={K,M,C,Y}");
    expect(en.theory_stella_desc).toContain("Klein four-group V₄");
    expect(en.theory_stella_desc).toContain("T1=B⊕T0={B,R,G,W}");
    expect(en.theory_stella_desc).toContain("unique nontrivial coset");
    expect(en.theory_stella_desc).toContain("Their compound in the same cube arrangement is called the Color Star (Stella Octangula)");
    expect(en.theory_stella_toggle_desc).toContain("preserve parity and move within the same tetrahedron");
    expect(en.theory_stella_toggle_desc).toContain("¬T0=T1");
    expect(en.theory_stella_toggle_desc).toContain("¬T1=T0");
    expect(en.theory_chromatic_octa_desc).toContain("six distance-1 edges");
    expect(en.theory_chromatic_octa_desc).toContain("six distance-2 edges");
    expect(en.theory_chromatic_octa_desc).toContain("do not represent bit-distance values");
    expect(en.theory_octa_fano_note).toContain("switching the XOR between 000 and 111");
    expect(en.theory_octa_duality_note).toContain("each die face corresponds to a vertex");

    expect(ja.theory_stella_desc).toContain("T0=ker π={K,M,C,Y}");
    expect(ja.theory_stella_desc).toContain("クライン四群V₄");
    expect(ja.theory_stella_desc).toContain("T1=B⊕T0={B,R,G,W}");
    expect(ja.theory_stella_desc).toContain("剰余類");
    expect(ja.theory_stella_desc).toContain("同じ立方体配置で二つを重ねたものを、カラースター（星形八面体）と呼びます");
    expect(ja.theory_stella_toggle_desc).toContain("偶奇を保ち、同じテトラの中を移動");
    expect(ja.theory_stella_toggle_desc).toContain("¬T0=T1");
    expect(ja.theory_stella_toggle_desc).toContain("¬T1=T0");
    expect(ja.theory_chromatic_octa_desc).toContain("距離1の6辺");
    expect(ja.theory_chromatic_octa_desc).toContain("距離2の6辺");
    expect(ja.theory_chromatic_octa_desc).toContain("辺の長さは、ビット距離の値を表しません");
    expect(ja.theory_octa_fano_note).toContain("XORは000と111の間で切り替わります");
    expect(ja.theory_octa_duality_note).toContain("各面を頂点に対応させた双対");
  });

  it("ends with exact boundaries between A, H, rank, and operations", () => {
    expect(en.theory_conn_limit_vertices).toContain("A contains exactly the eight binary states");
    expect(en.theory_conn_limit_vertices).toContain("points of H∖ι(A) are not additional elements of A");
    expect(en.theory_conn_limit_tone).toContain("L(g,r,b)=4g+2r+b");
    expect(en.theory_conn_limit_tone).toContain("affine extension λ");
    expect(en.theory_conn_limit_operations).toContain("XOR composes toggles");
    expect(en.theory_conn_limit_operations).toContain("not extended as a continuous operation");
    expect(en.theory_conn_limit_operations).toContain("affine complement κ̄(x)=1−x");
    expect(en.theory_conn_limit_operations).toContain("OR=XOR holds exactly for disjoint supports");

    expect(ja.theory_conn_limit_vertices).toContain("八つの二値状態だけ");
    expect(ja.theory_conn_limit_vertices).toContain("H∖ι(A)の点はAへ追加された色状態ではありません");
    expect(ja.theory_conn_limit_tone).toContain("L(g,r,b)=4g+2r+b");
    expect(ja.theory_conn_limit_tone).toContain("アフィン延長λ");
    expect(ja.theory_conn_limit_operations).toContain("XORは反転を合成");
    expect(ja.theory_conn_limit_operations).toContain("連続演算として拡張しません");
    expect(ja.theory_conn_limit_operations).toContain("アフィン補色 κ̄(x)=1−x");
    expect(ja.theory_conn_limit_operations).toContain("支持が重ならない場合に限ります");
  });

  it("does not restore acoustic, standards, novelty, extended-code, or superseded component copy", () => {
    const removedKeys = [
      "theory_continuous_title",
      "theory_continuous_desc",
      "theory_conn_extended",
      "theory_conn_limit_spaces",
      "theory_conn_limit_novelty",
      "theory_octa_title",
      "theory_tetra_title",
      "theory_dice_tetra",
      "theory_dice_desc3",
      "theory_dice_hint",
      "theory_scope_desc",
    ];
    for (const key of removedKeys) {
      expect(key in en).toBe(false);
      expect(key in ja).toBe(false);
    }

    const englishTheory = Object.entries(en)
      .filter(([key]) => key.startsWith("theory_"))
      .map(([, value]) => value)
      .join("\n");
    const japaneseTheory = Object.entries(ja)
      .filter(([key]) => key.startsWith("theory_"))
      .map(([, value]) => value)
      .join("\n");
    for (const excluded of ["OKLab", "[8,4,4]", "1981", "absolute frequency", "pitch map", "11 free cube nets"]) {
      expect(englishTheory).not.toContain(excluded);
    }
    for (const excluded of ["OKLab", "[8,4,4]", "1981年", "絶対周波数", "音高写像", "11種類"]) {
      expect(japaneseTheory).not.toContain(excluded);
    }
  });
});
