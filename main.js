/** ******************************************************************************************************************
 * @file Main file inside the @std/esm wrapper.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 18-Jan-2018
 *********************************************************************************************************************/
"use strict";

import vars           from './src/variables';
import { assignment } from './src/ast-vars';


let current;

export const callbacks = {
    general: {
        postload( tk, sk, cur )
        {
            current = cur;
        }
    },
    blockmanager: {
        postfinish( tk, sk, bm )
        {
            return calc_vars( bm );
        }
    }
};


function calc_vars( bm )
{
    const
        ast = current.ast,
        cfg = current.cfg,
        variables = vars( bm, ast, cfg.topScope );

    bm.forEach( b => {
        const node = b.first();
        if ( node ) b.scope = ast.node_to_scope( node );
        // b.prepare( this.vars );
    } );

    if ( /Function/.test( ast.root.type ) && ast.root.params && ast.root.params )
    {
        let fb = ast.root.cfg || cfg.blocks[ 0 ];
        ast.root.params.forEach( pnode => assignment( ast, fb, pnode, () => {} ) );
    }

    bm.forEach( block => ast.flat_walker( block.nodes, ( n, rec ) => assignment( ast, block, n, rec ) ) );

    variables.finish();
    variables.live_out();
}
