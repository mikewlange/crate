/*
 * Licensed to CRATE Technology GmbH ("Crate") under one or more contributor
 * license agreements.  See the NOTICE file distributed with this work for
 * additional information regarding copyright ownership.  Crate licenses
 * this file to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.  You may
 * obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * However, if you have executed any another commercial license agreement
 * with Crate these terms will supersede the license and you may use the
 * software solely pursuant to the terms of the relevant commercial agreement.
 */

package io.crate.operator.reference.sys;

import com.google.common.collect.ImmutableList;
import io.crate.metadata.ReferenceInfo;
import io.crate.metadata.sys.SysExpression;
import io.crate.metadata.sys.SystemReferences;
import org.cratedb.DataType;
import org.elasticsearch.common.inject.Inject;
import org.elasticsearch.common.transport.InetSocketTransportAddress;
import org.elasticsearch.common.transport.TransportAddress;
import org.elasticsearch.http.HttpServer;
import org.elasticsearch.node.service.NodeService;


public class NodePortExpression extends SysObjectReference<Integer> {

    abstract class PortExpression extends SysExpression<Integer> {

        private final ReferenceInfo info;

        PortExpression(ReferenceInfo info) {
            this.info = info;
        }

        @Override
        public ReferenceInfo info() {
            return info;
        }
    }

    public static final String COLNAME = "port";

    public static final String HTTP = "http";
    public static final String TRANSPORT = "transport";

    public static final ReferenceInfo INFO_PORT = SystemReferences.registerNodeReference(
            COLNAME, DataType.OBJECT);
    public static final ReferenceInfo INFO_PORT_HTTP = SystemReferences.registerNodeReference(
            COLNAME, DataType.INTEGER, ImmutableList.of(HTTP));
    public static final ReferenceInfo INFO_PORT_TRANSPORT = SystemReferences.registerNodeReference(
            COLNAME, DataType.INTEGER, ImmutableList.of(TRANSPORT));


    private final NodeService nodeService;
    private final HttpServer httpServer;

    @Inject
    public NodePortExpression(NodeService nodeService, HttpServer httpServer) {
        this.nodeService = nodeService;
        this.httpServer = httpServer;
        addChildImplementations();
    }

    @Override
    public ReferenceInfo info() {
        return INFO_PORT;
    }

    private void addChildImplementations() {
        childImplementations.put(HTTP, new PortExpression(INFO_PORT_HTTP) {
            @Override
            public Integer value() {

                return portFromAddress(httpServer.info().address().publishAddress()); //nodeService.stats().getNode().attributes().get("http_address"));
            }
        });
        childImplementations.put(TRANSPORT, new PortExpression(INFO_PORT_TRANSPORT) {
            @Override
            public Integer value() {
                return portFromAddress(nodeService.stats().getNode().address());
            }
        });
    }

    private Integer portFromAddress(TransportAddress address) {
        Integer port = 0;
        if (address instanceof InetSocketTransportAddress) {
            port = ((InetSocketTransportAddress) address).address().getPort();
        }
        return port;
    }

}
