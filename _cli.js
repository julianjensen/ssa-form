/** ****************************************************************************
 * DESCRIPTION
 * @author julian.jensen
 * @since 0.0.1
 *******************************************************************************/
"use strict";

require = require( 'esm' )( module, process.env.NODE_ENV === 'development' ? { mode: 'auto', debug: true, sourceMap: true, cache: false } : { mode: 'auto' } );
require( './cli' );

