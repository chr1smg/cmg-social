<?php
/**
 * Plugin Name: CMG header menu
 * Description: Loads wp-content/cmg-css/cmg-menu.js site-wide in the footer.
 *              The JS turns the header Services panel into the three-column
 *              layout and gives the phone drawer its slide-in panels; the CSS
 *              that styles all of it is SECTION 58 of cmg.css.
 *
 *              Approved by Chris 11 September 2026 ("Yes looks good").
 *              Record: claude project "Website",
 *              doc claude/CMG-Header-Menu-Rework-Sep-2026.md
 *
 *              It lives in mu-plugins rather than in a WPCode snippet because
 *              a direct database write to a WPCode snippet does not take
 *              effect on the front end (see the doc), and mu-plugins load
 *              themselves with nothing to press.
 *
 *              Version is filemtime(), so editing the .js busts the cache
 *              on its own. Replaces the temporary cmg-draft-menu.php.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( ! function_exists( 'cmg_menu_js' ) ) {
	function cmg_menu_js() {
		$rel  = '/cmg-css/cmg-menu.js';
		$file = WP_CONTENT_DIR . $rel;
		if ( ! is_readable( $file ) ) { return; }
		wp_enqueue_script(
			'cmg-menu',
			content_url( $rel ),
			array(),
			(string) filemtime( $file ),
			true
		);
	}
	add_action( 'wp_enqueue_scripts', 'cmg_menu_js', 20 );
}
