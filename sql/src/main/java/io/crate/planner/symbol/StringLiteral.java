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
 * However, if you have executed another commercial license agreement
 * with Crate these terms will supersede the license and you may use the
 * software solely pursuant to the terms of the relevant commercial agreement.
 */

package io.crate.planner.symbol;

import org.elasticsearch.common.io.stream.StreamInput;

import com.google.common.base.Preconditions;
import org.cratedb.DataType;
import org.elasticsearch.common.io.stream.StreamOutput;

import java.io.IOException;

public class StringLiteral extends Literal {

    public static final SymbolFactory<StringLiteral> FACTORY = new SymbolFactory<StringLiteral>() {
        @Override
        public StringLiteral newInstance() {
            return new StringLiteral();
        }
    };
    private String value;


    public StringLiteral(String value) {
        Preconditions.checkNotNull(value);
        this.value = value;
    }

    StringLiteral() {}

    @Override
    public SymbolType symbolType() {
        return SymbolType.STRING_LITERAL;
    }

    @Override
    public String value() {
        return value;
    }

    @Override
    public <C, R> R accept(SymbolVisitor<C, R> visitor, C context) {
        return visitor.visitStringLiteral(this, context);
    }

    @Override
    public void readFrom(StreamInput in) throws IOException {
        value = in.readString();
    }

    @Override
    public void writeTo(StreamOutput out) throws IOException {
        out.writeString(value);
    }

    @Override
    public DataType valueType() {
        return DataType.STRING;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        StringLiteral that = (StringLiteral) o;

        if (!value.equals(that.value)) return false;

        return true;
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }
}
