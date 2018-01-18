/** ******************************************************************************************************************
 * @file Describe what manager does.
 * @author Julian Jensen <jjdanois@gmail.com>
 * @since 1.0.0
 * @date 02-Jan-2018
 *********************************************************************************************************************/
"use strict";

import assert from 'assert';
import { error, warn } from './utils';
import { postOrder } from 'traversals';
import dot from './dot';
import vars from './variables';
import { assignment } from './ast-vars';
import CFGBlock from './block';
import { Block, Edge } from './types';
import Edges from './edges';

/**
 * @type {Iterable<CFGBlock>}
 */
export default class BlockManager
{
    /**
     * @param {AST} ast
     * @param {CFGOptions} options
     */
    constructor( ast, options )
    {
        BlockManager.blockId = 0;
        this.edges           = new Edges( this );
        /** @type {CFGBlock[]} */
        this.blocks = [];
        this.loops     = [];
        this.startNode = this.block().as( Block.START );
        this.toExit    = [];
        this.ast       = ast;
        this.options   = options;
    }

    /**
     * @param {CFGBlock} block
     */
    toExitNode( block )
    {
        this.toExit.push( block );
    }

    /**
     *
     * @param {Array<CFGBlock>} final
     * @param {CFGInfo} cfg
     */
    finish( final, cfg )
    {
        const ast = this.ast;

        if ( final )
            final.forEach( f => this.toExitNode( f ) );

        this.exitNode = this.block().as( Block.EXIT );
        this.toExit.forEach( b => {
            b.to( this.exitNode );
            if ( b.deferredEdgeType )
                b.classify( this.exitNode, b.deferredEdgeType );
        } );

        this.clean();

        BlockManager.blockId = this.size = this.blocks.length;

        this.vars = vars( this, ast, cfg.topScope );

        this.forEach( b => {
            const node = b.first();
            if ( node ) b.scope = ast.node_to_scope( node );
            b.prepare( this.vars );
        } );

        if ( /Function/.test( ast.root.type ) && ast.root.params && ast.root.params )
        {
            let fb = ast.root.cfg || this.blocks[ 0 ];
            ast.root.params.forEach( pnode => assignment( ast, fb, pnode, () => {} ) );
        }

        this.forEach( block => ast.flat_walker( block.nodes, ( n, rec ) => assignment( ast, block, n, rec ) ) );

        this.vars.finish();
        this.vars.live_out();
    }

    /**
     * @param {function(CFGBlock,number,Array<CFGBlock>):*} fn
     */
    forEach( fn )
    {
        this.blocks.forEach( ( b, i, bl ) => b && fn( b, i, bl ) );
    }

    map( fn )
    {
        return this.blocks.map( fn );
    }

    /**
     * @param {number}  index
     * @return {CFGBlock}
     */
    get( index )
    {
        return this.blocks[ index ];
    }

    /**
     * @returns {CFGBlock}
     */
    block()
    {
        assert( this.edges );
        const block = new CFGBlock( BlockManager.blockId++, this.edges );

        this.blocks[ block.id ] = block;
        if ( this.loops.length )
            block.as( Block.LOOP );

        return block;
    }

    toString()
    {
        return this.blocks.map( b => `${b}` ).join( '\n' );
    }

    toTable()
    {
        return this.blocks.map( b => b.toRow() );
    }

    /**
     * @type {Iterable<CFGBlock>}
     */
    *[ Symbol.iterator ]()
    {
        for ( const block of this.blocks )
        {
            if ( !block ) continue;
            yield block;
        }
    }

    /**
     * @param {string} title
     */
    create_dot( title )
    {
        const
            cond   = [],
            uncond = [];

        this.blocks.forEach( b => {
            for ( const edge of this.edges.edges( b ) )
            {
                if ( edge.type.isa( Edge.TRUE | Edge.FALSE | Edge.EXCEPTION ) )
                    cond.push( edge );
                else
                    uncond.push( edge );
            }
        } );

        return dot( {
            title,
            nodeLabels:    [ ...this ].map( b => b.graph_label() ),
            start:         this.startNode.id,
            end:           this.exitNode.id,
            conditional:   cond,
            unconditional: uncond,
            blocks:        this.blocks
        } );
    }

    pack( blocks )
    {
        const
            offsets = [],
            packed  = [];

        let cur = 0;

        for ( let i = 0; i < BlockManager.blockId; i++ )
        {
            if ( blocks[ i ] && !blocks[ i ].isa( Block.DELETED ) )
            {
                blocks[ i ].oldId = blocks[ i ].id;
                blocks[ i ].id    = packed.length;
                packed.push( blocks[ i ] );
                cur = blocks[ i ].id - blocks[ i ].oldId;
            }

            offsets.push( cur );
        }

        this.edges.renumber( offsets );
        return packed;
    }

    clean()
    {
        let changed = true,
            blocks  = this.blocks;

        /**
         * @param {number} blockIndex
         */
        function pass( blockIndex )
        {
            const block = blocks[ blockIndex ];

            if ( !block || block.isa( Block.DELETED ) || block.isa( Block.START ) || block.isa( Block.EXIT ) ) return;

            if ( block.isa( Block.TEST ) )
            {
                if ( block.succs.length === 2 && block.succs[ 0 ] === block.succs[ 1 ] )
                {
                    const succ = block.succs[ 0 ];
                    block.remove_succs();
                    block.as( Block.NORMAL ).to( succ );
                    changed = true;
                }
            }

            if ( block.succs.length === 1 )
            {
                const
                    succ = block.succs[ 0 ];

                if ( !succ || succ.isa( Block.START ) || succ.isa( Block.EXIT ) ) return;

                if ( block.isEmpty() )
                {
                    if ( block.eliminate() ) changed = true;
                }

                if ( !block.isa( Block.DELETED ) && !succ.isa( Block.DELETED ) && succ.preds.length === 1 )
                {
                    if ( !succ.isEmpty() && succ.scope === block.scope )
                    {
                        const
                            on = succ.nodes.slice();

                        succ.nodes.length = 0;
                        if ( succ.eliminate() )
                        {
                            block.nodes = block.nodes.concat( on );
                            changed     = true;
                            block.types |= ( succ.types & ~Block.DELETED );
                        }
                        else
                            succ.nodes = on;
                    }

                    if ( succ.isEmpty() && succ.isa( Block.TEST ) )
                    {
                        block.as( Block.TEST );
                        block.remove_succ( succ );
                        succ.eliminate();
                        changed = true;
                    }
                }
            }
        }

        blocks.forEach( b => !b.succs.length && !b.preds.length && !b.isa( Block.START ) && !b.isa( Block.EXIT ) && b.as( Block.DELETED ) );
        blocks = this.pack( blocks );

        while ( changed )
        {
            changed = false;

            postOrder( blocks.map( b => b.succs.map( s => s.id ) ), pass );

            if ( changed )
                blocks = this.pack( blocks );
        }

        this.blocks = blocks;
    }

    in_loop( id )
    {
        this.loops.push( id );
    }

    out_loop( id )
    {
        let skipped = [];

        if ( this.loops[ this.loops.length - 1 ] === id )
            this.loops.pop();
        else
        {
            while ( this.loops.length )
            {
                const top = this.loops.pop();
                if ( top === id ) break;
                skipped.push( top );
            }

            if ( !this.loops.length )
                console.error( error( `Skipped all loops with id ${id}` ) );
            else
                console.log( warn( `Skipping loop nesting [ ${skipped.join( ', ' )} ] with ${id}` ) );
        }
    }
}

BlockManager.blockId = 0;

// module.exports = BlockManager;
