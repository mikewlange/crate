/*
 * This file is part of a module with proprietary Enterprise Features.
 *
 * Licensed to Crate.io Inc. ("Crate.io") under one or more contributor
 * license agreements.  See the NOTICE file distributed with this work for
 * additional information regarding copyright ownership.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 *
 * To use this file, Crate.io must have given you permission to enable and
 * use such Enterprise Features and you must have a valid Enterprise or
 * Subscription Agreement with Crate.io.  If you enable or use the Enterprise
 * Features, you represent and warrant that you have a valid Enterprise or
 * Subscription Agreement with Crate.io.  Your use of the Enterprise Features
 * if governed by the terms and conditions of your Enterprise or Subscription
 * Agreement with Crate.io.
 */

package io.crate.operation.user;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import io.crate.analyze.WhereClause;
import io.crate.metadata.*;
import io.crate.metadata.expressions.RowCollectExpressionFactory;
import io.crate.metadata.sys.SysSchemaInfo;
import io.crate.metadata.table.ColumnRegistrar;
import io.crate.metadata.table.StaticTableInfo;
import io.crate.types.DataTypes;
import org.apache.lucene.util.BytesRef;
import org.elasticsearch.cluster.service.ClusterService;

import javax.annotation.Nullable;
import java.util.Map;
import java.util.Set;

public class SysUsersTableInfo extends StaticTableInfo {

    public static final TableIdent IDENT = new TableIdent(SysSchemaInfo.NAME, "users");
    private static final RowGranularity GRANULARITY = RowGranularity.DOC;

    public static class Columns {
        public static final ColumnIdent NAME = new ColumnIdent("name");
        public static final ColumnIdent SUPERUSER = new ColumnIdent("superuser");
    }

    private static final ImmutableList<ColumnIdent> PRIMARY_KEY = ImmutableList.of(Columns.NAME);
    private final ClusterService clusterService;

    public SysUsersTableInfo(ClusterService clusterService) {
        super(IDENT, new ColumnRegistrar(IDENT, GRANULARITY)
                .register(Columns.NAME, DataTypes.STRING)
                .register(Columns.SUPERUSER, DataTypes.BOOLEAN),
            PRIMARY_KEY);
        this.clusterService = clusterService;
    }

    @Override
    public RowGranularity rowGranularity() {
        return GRANULARITY;
    }

    @Override
    public Routing getRouting(WhereClause whereClause, @Nullable String preference) {
        return Routing.forTableOnSingleNode(IDENT, clusterService.localNode().getId());
    }

    @Override
    public Set<User.Role> requiredUserRoles() {
        return ImmutableSet.of(User.Role.SUPERUSER);
    }

    public static Map<ColumnIdent, RowCollectExpressionFactory<User>> sysUsersExpressions() {
        return ImmutableMap.<ColumnIdent, RowCollectExpressionFactory<User>>builder()
            .put(SysUsersTableInfo.Columns.NAME, () -> new RowContextCollectorExpression<User, BytesRef>() {
                @Override
                public BytesRef value() {
                    return new BytesRef(row.name());
                }
            })
            .put(SysUsersTableInfo.Columns.SUPERUSER, () -> new RowContextCollectorExpression<User, Boolean>() {
                @Override
                public Boolean value() {
                    return row.roles().contains(User.Role.SUPERUSER);
                }
            })
            .build();
    }
}
